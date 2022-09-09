import { DATA_KEYS } from "../dataKeys.js";

const ecuSerial = 0x00007ad0 & 0x7ff; // used to decode message IDs

const OPENINVERTER_CAN_MAP = {
  /**
   * 1E0012D0
   * RTC:  (1/1000 sec since power on)xx:xx:xx.xx  time[0..3]
   * RPM:  xx,xxx RPM[4..7]
   * @param {Buffer} data
   */
  0x1e001000: (data) => {
    return [
      // { id: DATA_KEYS.RTC, data: data. },
      { id: DATA_KEYS.RPM, data: data.readInt32BE(4) / 256 },
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
      { id: DATA_KEYS.FUEL_FLOW, data: data.readInt32BE(4) / 256 },
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
      { id: DATA_KEYS.PEDAL_POSITION, data: data.readInt32BE(0) / 256 },
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
      { id: DATA_KEYS.TARGET_AFR, data: data.readInt32BE(0) / 256 },
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
      { id: DATA_KEYS.IGNITION_TIMING, data: data.readInt32BE(0) / 256 },
      { id: DATA_KEYS.AFR_AVERAGE, data: data.readInt32BE(4) / 256 },
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
      { id: DATA_KEYS.MAP, data: data.readInt32BE(0) / 256 },
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
      { id: DATA_KEYS.MAT, data: data.readInt32BE(0) / 256 },
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
      { id: DATA_KEYS.BAR_PRESSURE, data: data.readInt32BE(0) / 256 },
      { id: DATA_KEYS.CTS, data: data.readInt32BE(4) / 256 },
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
      { id: DATA_KEYS.OIL_PRESSURE, data: data.readInt32BE(0) / 256 },
      { id: DATA_KEYS.BATT_VOLTAGE, data: data.readInt32BE(4) / 256 },
    ];
  },

  /**
   * 371
   * 881 in decimal
   * 11 bit Id picked at random as OI is configurable but uses 11 bit Id's.
   *
   * High Voltage Battery Voltage     xxx.x volts
   * @param {Buffer} data
   * @returns
   */

   0x371: (data) => {
     
    return [
      // FIXME: Should make a new key rather than overloading BATT_VOLTAGE.
      { id: DATA_KEYS.BATT_VOLTAGE, data: data.readInt32LE(0)},
    ];
  },

  /**
   * 0x1E049000
   * Line Pressure  xxx percent
   * Speed          xxx MPH
   */
};

const openInverterDecoder = {
  /**
   * @param {{ ts: number; id: number; data: Uint8Array; ext: boolean; }} canMsg
   * @returns {[{id:Number, data:Number}] | []}
   */
  do: (canMsg) => {
    console.log(canMsg.id.toString(16));
    console.log(canMsg);
    // TODO: Replace racepak messages/ids/serial masking/etc with OI stuff.
    const decodedId = canMsg.id & 0xfffff800;
    const decodedId11bit = canMsg.id  // TODO: better 11 vs 29 bit handling.
    if (!!OPENINVERTER_CAN_MAP[decodedId]) {
      console.log("29 bit");
      return OPENINVERTER_CAN_MAP[decodedId](Buffer.from(canMsg.data.buffer));
    } else if (!!OPENINVERTER_CAN_MAP[decodedId11bit]) {
      console.log("11 bit");
      console.log(OPENINVERTER_CAN_MAP[decodedId11bit](Buffer.from(canMsg.data.buffer)));
      return OPENINVERTER_CAN_MAP[decodedId11bit](Buffer.from(canMsg.data.buffer));
    } else {
      console.log("id not found in map");
      return [];
    }
  },
};

export default openInverterDecoder;
