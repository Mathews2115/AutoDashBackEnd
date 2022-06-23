import { performance } from "perf_hooks";
import racePackDecoder from "./CAN/racepakDecoder.js";
import an400Decoder from "./CAN/an400Decorder.js";
import { DATA_KEYS, WARNING_KEYS } from "./dataKeys.js";
import DataStore from "./DataStore.js";
import RingBuffer from "./lib/ringBuffer.js";
import ButtonManager from "./IO/Buttons.js";

export default (carSettings) => {
  let buttons = new ButtonManager([
    // fuel reset button
    {
      onReleased: () => {
        gallonsLeft = carSettings.tank_size
        ecuDataStore.write(DATA_KEYS.FUEL_LEVEL, 100)
      },
      holdNeeded: true,
    },
    {
      // light / dark theme toggle
      onPressed: () =>
        ecuDataStore.write(
          DATA_KEYS.LOW_LIGHT_DETECTED,
          ecuDataStore.read(DATA_KEYS.LOW_LIGHT_DETECTED) ? 0 : 1
        ),
      holdNeeded: false,
    },
  ]);
  let msSample = 0;
  let lastMpgSampleTime = 0;
  let distance = 0;
  let lastFuelSample = 0; // Last Gal / Millisecond sample
  let baseOdometerReading = 0; // odometer reading when app started
  const ecuDataStore = new DataStore(); // just assign a big ass buffer
  const mpgSampler = new RingBuffer(Buffer.alloc(1024));
  let gallonsLeft = 0;

  // assign decoder - currently this was designed for racepak but we have LOOSE support for an400 stuff
  const decoder = carSettings.can_type === "an400" ? an400Decoder : racePackDecoder;

  /**
   * Initialize Fuel Readings - get the last known gallons left
   * @param {Number} persistedGallonsLeft
   */
  const initializeFuel = (persistedGallonsLeft) => {
    gallonsLeft = persistedGallonsLeft;
    ecuDataStore.write(DATA_KEYS.FUEL_LEVEL, 0);
    ecuDataStore.write(DATA_KEYS.AVERAGE_MPG, 0);
    ecuDataStore.write(DATA_KEYS.CURRENT_MPG, 0);
    ecuDataStore.write(DATA_KEYS.TEMP_TYPE, 0); // default to F
    ecuDataStore.write(DATA_KEYS.PRESSURE_TYPE, 1); // default to kpa (used for MAP) / /make sure you front end gets what it expects!
    updateFuelLeft();
  };

  /**
   * Initialize the Odometer reading with the last known saved readout
   * @param {Number} lastSavedReading - last saved odometer reading
   */
  const initializeOdometer = (lastSavedReading) => {
    baseOdometerReading = lastSavedReading || carSettings.odometer;
    ecuDataStore.write(DATA_KEYS.ODOMETER, baseOdometerReading);
  };

  const init = ({ gallonsLeft, odometer }) => {
    if (carSettings.buttons_enabled) {
      buttons.start(); // start listening for button presses
    }
    initializeFuel(gallonsLeft);
    initializeOdometer(odometer);

    msSample = performance.now();
    lastMpgSampleTime = performance.now();
  };

  const updateFuelLeft = () => {
    ecuDataStore.write(
      DATA_KEYS.FUEL_LEVEL,
      Math.max(0, Math.ceil((gallonsLeft / carSettings.tank_size) * 100))
    );
  }

  const updateValue = ({ id, data }) => {
    // do any special handling depending on the new updated value
    switch (id) {
      case DATA_KEYS.FUEL_FLOW:
        const newMsSample = performance.now();
        const msDelta = newMsSample - msSample; // ms since last sample

        //  calculate fuel consumption based on the last sample
        const gpMs = (data * 0.1621) / 3600000; // convert from pounds/hour to gal/hour, then to to gal/millisecond
        const pMin = Math.min(lastFuelSample, gpMs);
        const gallonsConsumed =
          (msDelta * (Math.max(lastFuelSample, gpMs) - pMin)) / 2 +  msDelta * pMin;

        // update the fuel level
        gallonsLeft -= gallonsConsumed;

        // SPEED BASED DISTANCE - distance (m) = speed (m/millisecond) * time (ms)
        // calculate distance since last sample
        // we do this because the odometer is in mile denom; where as can get tiny slices of a mile traveled based on the speed and time
        distance =
          (ecuDataStore.read(DATA_KEYS.GPS_SPEEED) / 3600000) * msDelta;

        // calc average MPGs
        const currentMpg = Math.floor(distance / gallonsConsumed);

        // add a new sample every 10 seconds
        if (newMsSample - lastMpgSampleTime > 10000) {
          lastMpgSampleTime = newMsSample;
          ecuDataStore.averageMPGPoints.push(mpgSampler.average);
          ecuDataStore.write(
            DATA_KEYS.AVERAGE_MPG_POINT_INDEX,
            ecuDataStore.averageMPGPoints.frontOffset
          );
          ecuDataStore.write(
            DATA_KEYS.AVERAGE_MPG,
            ecuDataStore.averageMPGPoints.average
          );
          mpgSampler.reset();
        } else {
          mpgSampler.push(currentMpg);
        }

        ecuDataStore.write(DATA_KEYS.CURRENT_MPG, currentMpg);
        updateFuelLeft();

        msSample = newMsSample;
        lastFuelSample = gpMs;
        break;
      case DATA_KEYS.CTS:
        ecuDataStore.updateWarning(
          WARNING_KEYS.ENGINE_TEMPERATURE,
          data > carSettings.engine_temp_high
        );
        break;
      case DATA_KEYS.OIL_PRESSURE:
        ecuDataStore.updateWarning(
          WARNING_KEYS.OIL_PRESSURE,
          data < carSettings.oil_low_limit
        );
        break;
      case DATA_KEYS.BATT_VOLTAGE:
        ecuDataStore.updateWarning(
          WARNING_KEYS.BATT_VOLTAGE,
          data < carSettings.voltage_low_limit
        );
        break;
      case DATA_KEYS.ODOMETER:
        // the data represents the offset from our base odometer reading
        // if data is zero, that means the odometer reading has been reset to zero
        if (data === 0) {
          //update our base reading to be whatever we have stored in the current odometer
          baseOdometerReading = ecuDataStore.read(DATA_KEYS.ODOMETER);
        }
        data += baseOdometerReading;
        break;
      default:
        break;
    }

    if (id < WARNING_KEYS.FIRST) {
      // write data from CAN BUS  to store
      ecuDataStore.write(id, data);
    } else {
      ecuDataStore.updateWarning(id, data);
    }
  };

  /**
   * if error, turns GPS error flag on
   * else updates GPS data
   * Returns updater callback to be used next time
   * @returns {Function}
   */
  const gpsUpdate = (msg) => {
    if (!msg) {
      // canparsing failure, shutdown
      return gpsUpdateStateToBroked(msg);
    }
    msg.forEach((newData) => updateValue(newData));
    return gpsUpdate;
  };

  /**
   * turns off GPS error; updates GPS data
   * Returns updater callback to be used next time
   * @returns {Function}
   */
  const gpsUpdateStateToWorking = (msg) => {
    if (msg) {
      ecuDataStore.updateWarning(WARNING_KEYS.GPS_ERROR, false);
      return gpsUpdate(msg);
    }
    return gpsUpdateStateToWorking;
  };

  /**
   * Turns GPS error on
   * Returns updater callback to be used next time
   * @returns {Function}
   */
  const gpsUpdateStateToBroked = (msg) => {
    ecuDataStore.updateWarning(WARNING_KEYS.GPS_ERROR, true);
    return gpsUpdateStateToWorking;
  };

  /** @type {Function} */
  let gpsUpdater = gpsUpdate;

  const ecu = {
    init,
    stop: () => {
      try {
        buttons.stop();
      } catch (error) {}
    },
    /**
     *
     * @returns {Buffer}
     */
    latestPacket: () => ecuDataStore.buffer,
    persistantData: () => {
      return {
        odometer: ecuDataStore.read(DATA_KEYS.ODOMETER),
        gallonsLeft: gallonsLeft,
      };
    },

    /**
     * @param {{ ts: number; id: number; data: Uint8Array; ext: boolean; } | false} msg
     */
    updateFromCanBus: (msg) => {
      if (msg === false) {
        // canparsing failure, shutdown
        ecuDataStore.updateWarning(WARNING_KEYS.ECU_COMM, true);
      } else {
        ecuDataStore.updateWarning(WARNING_KEYS.ECU_COMM, false);
        decoder.do(msg).forEach((newData) => updateValue(newData));
      }
    },

    // Updates GPS data, if error, will turn error off on next successful update
    updateFromGPS: (msg) => {
      gpsUpdater = gpsUpdater(msg);
    },
  };
  return ecu;
};
