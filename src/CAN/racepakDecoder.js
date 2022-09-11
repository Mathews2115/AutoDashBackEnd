import { DATA_MAP } from "../dataKeys.js";
const RACEPACK_CAN_MAP = {
  /**
   * 1E0012D0
   * RTC:  (1/1000 sec since power on)xx:xx:xx.xx  time[0..3]
   * RPM:  xx,xxx RPM[4..7]
   * @param {Buffer} data
   */
  0x1e001000: (data) => {
    return [
      // { id: DATA_KEYS.RTC, data: data. },
      { id: DATA_MAP.RPM, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 1E005000
   * Injector Pulsewidth  xx.x  milliseconds
   * Fuel Flow            x,xxx pounds/hour
   * @param {Buffer} data
   */
  0x1e005000: (data) => {
    return [
      // { id: DATA_KEYS.INJECTOR_PULSEWIDTH, data: data.readInt32BE(0) / 256 },
      { id: DATA_MAP.FUEL_FLOW, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 1E009000
   * Closed Loop Status on/off
   * Duty Cycle         xxx.x percent
   */

  /**
   * Pedal Position xxx percent
   * Fuel Pressure  xxx psi
   * @param {Buffer} data
   * @returns
   */
  0x1e029000: (data) => {
    return [
      { id: DATA_MAP.PEDAL_POSITION, data: data.readInt32BE(0) / 256 },
      // { id: DATA_KEYS.FUEL_PRESSURE, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 1E00D000
   * AFR Left                   xx.x A/F
   * Closed Loop Compensation   xxx percent
   */

  /**
   * 1E011000
   * Target AFR                   xx.x A/F
   * AFR Right                    xx.x A/F
   * @param {Buffer} data
   * @returns
   */
  0x1E011000: (data) => {
    return [
      { id: DATA_MAP.TARGET_AFR, data: data.readInt32BE(0) / 256 },
      // { id: DATA_KEYS.AFR_RIGHT, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 1E015000
   * Ignition Timing  xx.x degrees
   * AFR Average      xx.x A/F
   * @param {Buffer} data
   * @returns
   */
  0x1E015000: (data) => {
    return [
      { id: DATA_MAP.IGNITION_TIMING, data: data.readInt32BE(0) / 256 },
      { id: DATA_MAP.AFR_AVERAGE, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 1E019000
   * Manifold Air Pressure (MAP)    xxx kPa
   * Knock Retard                   x degrees
   * @param {Buffer} data
   * @returns
   */
   0x1E019000: (data) => {
    return [
      { id: DATA_MAP.MAP, data: data.readInt32BE(0) / 256 },
      // { id: DATA_KEYS.KNOCK_RETARD, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 1E01D000
   * Manifold Air Temperature (MAT)xxx F
   * Throttle Position Sensor (TPS)xxx percent
   * @param {Buffer} data
   * @returns
   */
   0x1E01D000: (data) => {
    return [
      { id: DATA_MAP.MAT, data: data.readInt32BE(0) / 256 },
      // { id: DATA_KEYS.TPS, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 1E021000
   * Barometric Pressure          xxx.x kPa
   * Coolant Temperature (CTS)    xxx F
   * @param {Buffer} data
   * @returns
   */
   0x1E021000: (data) => {
    return [
      { id: DATA_MAP.BAR_PRESSURE, data: data.readInt32BE(0) / 256 },
      { id: DATA_MAP.CTS, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 1E025000
   * Oil Pressure         xxx   psi
   * Battery Voltage      xx.x volts
   * @param {Buffer} data
   * @returns
   */
   0x1E025000: (data) => {
     
    return [
      { id: DATA_MAP.OIL_PRESSURE, data: data.readInt32BE(0) / 256 },
      { id: DATA_MAP.BATT_VOLTAGE, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 0x1E049000
   * Line Pressure  xxx percent
   * Speed          xxx MPH
   */
};

// BIG NOTE:  (note for OpenINverter that uses LE)
// Double check your ECU stores data Big Endian or Little Endian
// and use the appropriate method to read the data
// ex: data.readInt32BE(0) or data.readInt32LE(0)
const racePackDecoder = {
  /**
   * @param {{ ts: number; id: number; data: Uint8Array; ext: boolean; }} canMsg
   * @returns {[{id:import("../dataKeys.js").DataMapEntry, data:Number}] | []}
   */
  do: (canMsg) => {
    const decodedId = canMsg.id & 0xfffff800;
    if (!!RACEPACK_CAN_MAP[decodedId]) {
      return RACEPACK_CAN_MAP[decodedId](Buffer.from(canMsg.data.buffer));
    } else {
      return [];
    }
  },
};

export default racePackDecoder;

// TODO: figure out way of not having to access key each time, (bake it in on init, reduce cycles)