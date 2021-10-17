import { performance } from 'perf_hooks';
import racePackDecoder from './CAN/racepakDecoder.js';
import { DATA_KEYS, WARNING_KEYS } from './dataKeys.js';
import DataStore from './DataStore.js';
import RingBuffer from './lib/ringBuffer.js';
import FuelLevelResetButton from './IO/FuelLevelResetButton.js';

const decoder = racePackDecoder; // alias

export default (carSettings) => {
  let msSample = 0;
  let lastMpgSampleTime = 0;
  let distance = 0;
  let lastFuelSample = 0; // Last Gal / Millisecond sample
  const ecuDataStore = new DataStore(); // just assign a big ass buffer
  const mpgSampler = new RingBuffer(Buffer.alloc(1024));
  const fuelLevelReset = new FuelLevelResetButton(() => ecuDataStore.write(DATA_KEYS.FUEL_LEVEL, 100));

  const persistantData = {
    gallonsLeft: 0,
  };

  const init = ({ gallonsLeft }) => {
    persistantData.gallonsLeft = gallonsLeft;
    ecuDataStore.write(DATA_KEYS.ODOMETER, carSettings.odometer);
    ecuDataStore.write(DATA_KEYS.FUEL_LEVEL, 100); // percent - for now, until we save out our level to HDD
    ecuDataStore.write(DATA_KEYS.AVERAGE_MPG, 0);
    ecuDataStore.write(DATA_KEYS.CURRENT_MPG, 0);
    msSample = performance.now();
    lastMpgSampleTime = performance.now();
  };

  const updateValue = ({ id, data }) => {
    // do any special handling depending on the new updated value
    switch (id) {
      case DATA_KEYS.FUEL_FLOW:
        const newMsSample = performance.now();
        const msDelta = newMsSample - msSample; // ms since last sample

        //  calculate fuel consumption based on the last sample
        const gpMs = (data * 0.1621) / 3600000; // convert from pounds/hour to gal/hour, then to to gal/millisecond
        const pMin = Math.min(lastFuelSample, gpMs);
        const gallonsConsumed = (msDelta * (Math.max(lastFuelSample, gpMs) - pMin)) / 2 + msDelta * pMin;

        // update the fuel level
        persistantData.gallonsLeft -= gallonsConsumed;

        // SPEED BASED DISTANCE - distance (m) = speed (m/millisecond) * time (ms)
        // calculate distance since last sample
        // we do this because the odometer is in mile denom; where as can get tiny slices of a mile traveled based on the speed and time
        distance = (ecuDataStore.read(DATA_KEYS.GPS_SPEEED) / 3600000) * msDelta;

        // calc average MPGs
        const currentMpg = Math.floor(distance / gallonsConsumed);

        // add a new sample every 5 seconds
        if (newMsSample - lastMpgSampleTime > 5000) {
          lastMpgSampleTime = newMsSample;
          ecuDataStore.averageMPGPoints.push(mpgSampler.average);
          ecuDataStore.write(
            DATA_KEYS.AVERAGE_MPG_POINT_INDEX,
            ecuDataStore.averageMPGPoints.frontOffset,
          );
          ecuDataStore.write(DATA_KEYS.AVERAGE_MPG, ecuDataStore.averageMPGPoints.average);
          mpgSampler.reset();
        } else {
          mpgSampler.push(currentMpg);
        }

        ecuDataStore.write(DATA_KEYS.CURRENT_MPG, currentMpg);
        ecuDataStore.write(
          DATA_KEYS.FUEL_LEVEL,
          Math.ceil((persistantData.gallonsLeft / carSettings.tank_size) * 100),
        );

        msSample = newMsSample;
        lastFuelSample = gpMs;
        break;
      case DATA_KEYS.CTS:
        ecuDataStore.updateWarning(
          WARNING_KEYS.ENGINE_TEMPERATURE,
          data > carSettings.engine_temp_high,
        );
        break;
      case DATA_KEYS.OIL_PRESSURE:
        // not connected yets
        // ecuDataStore.updateWarning(WARNING_KEYS.OIL_PRESSURE, (data < carSettings.oil_low_limit));
        break;
      case DATA_KEYS.BATT_VOLTAGE:
        ecuDataStore.updateWarning(WARNING_KEYS.BATT_VOLTAGE, data < carSettings.voltage_low_limit);
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
    /**
     *
     * @returns {Buffer}
     */
    latestPacket: () => ecuDataStore.buffer,

    persistantData,

    /**
     * @param {{ ts: number; id: number; data: Uint8Array; ext: boolean; } | false} msg
     */
    updateFromCanBus: (msg) => {
      if (msg === false) {
        // canparsing failure, shutdown
        ecuDataStore.updateWarning(WARNING_KEYS.ECU_COMM, true);
      } else {
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
