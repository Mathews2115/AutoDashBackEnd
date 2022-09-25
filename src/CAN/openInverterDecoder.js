import { DATA_MAP } from "../dataKeys.js";

// NOTE: (note for OpenInverter that uses LittleEndian(LE) functions)
const OPENINVERTER_CAN_MAP = {

   0x371: (data) => {
     
    return [
      { id: DATA_MAP.HV_BATT_VOLTAGE, data: data.readInt32LE(0)},
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
