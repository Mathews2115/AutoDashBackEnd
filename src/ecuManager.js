import racePackDecoder from "./CAN/racepakDecoder.js";
import {DATA_KEYS, WARNING_KEYS} from "./dataKeys.js"

const decoder = racePackDecoder; // alias

// TODO move this to yml file
const OIL_LOW_LIMIT = 15; //psi
const VOLTAGE_LOW_LIMIT = 11.4;
const ENGINE_TEMP_HIGH = 240;


// easy way to keep track where we store data
let offset = 0;
const TYPES = {
  ONE_BYTE: 1,
  TWO_BYTES: 2,
  FLOAT: 3,
  BITFIELD: 4,
}
class PacketEntry {
  constructor(type)  {
    this.type = type;
    switch (type) {
      case TYPES.ONE_BYTE:
        this.byteLength = 1;
        break;
      case TYPES.TWO_BYTES:
        this.byteLength = 2;
        break;
      case TYPES.FLOAT:
        this.byteLength = 4;
        break;
      case TYPES.BITFIELD:
        this.byteLength = 1;
        
        break;
      default:
        throw "Critical Error: missed logic type";
    }
    this.byteOffset = offset;
    offset += this.byteLength; // Update global offset
  }
}

class DataStore {
  constructor() {
    // This it the order data is stored; mind the offset generated
    this.packetKeys = []
    this.packetKeys[DATA_KEYS.PEDAL_POSITION] = new PacketEntry(TYPES.ONE_BYTE); // xxx percent
    this.packetKeys[DATA_KEYS.RPM] =  new PacketEntry(TYPES.TWO_BYTES);           // xx,xxx
    this.packetKeys[DATA_KEYS.FUEL_FLOW] = new PacketEntry(TYPES.TWO_BYTES); // Fuel Flow  x,xxx pounds/hour
    this.packetKeys[DATA_KEYS.TARGET_AFR] = new PacketEntry(TYPES.FLOAT);  // xx.x A/F
    this.packetKeys[DATA_KEYS.AFR_AVERAGE] = new PacketEntry(TYPES.FLOAT); // xx.x A/F
    this.packetKeys[DATA_KEYS.IGNITION_TIMING] = new PacketEntry(TYPES.FLOAT);  // xx.x degrees
    this.packetKeys[DATA_KEYS.MAP] = new PacketEntry(TYPES.TWO_BYTES);  // xxx kPa
    this.packetKeys[DATA_KEYS.MAT] = new PacketEntry(TYPES.TWO_BYTES); // xxx F
    this.packetKeys[DATA_KEYS.CTS] = new PacketEntry(TYPES.TWO_BYTES); // xxx F
    this.packetKeys[DATA_KEYS.BAR_PRESSURE] = new PacketEntry(TYPES.FLOAT); // xxx.x kPa
    this.packetKeys[DATA_KEYS.OIL_PRESSURE] = new PacketEntry(TYPES.TWO_BYTES); // xxx   psi
    this.packetKeys[DATA_KEYS.BATT_VOLTAGE] = new PacketEntry(TYPES.FLOAT); // xx.x volts
    this.packetKeys[DATA_KEYS.WARNINGS] = new PacketEntry(TYPES.BITFIELD); 

    this.buffer = Buffer.alloc(Math.max(1024, offset));

    this.warningsBuffer = this.buffer.slice(this.packetKeys[DATA_KEYS.WARNINGS].byteOffset);
  }

  write(key, value) {
    switch (this.packetKeys[key].type) {
      case TYPES.ONE_BYTE:
        this.buffer.writeInt8(value, this.packetKeys[key].byteOffset);
        break;
      case TYPES.TWO_BYTES:
        this.buffer.writeInt16BE(value, this.packetKeys[key].byteOffset);
        break;
      case TYPES.FLOAT:
        this.buffer.writeFloatBE(value, this.packetKeys[key].byteOffset);
        break;
      default:
        throw "Critical Error: missed logic type";
    }
  }

  // 0 -> 7
  updateWarning(id, value) {
    const bit = id - WARNING_KEYS.FIRST;
    if (bit > 7) throw "I screwed up: error - bit field key cannot be > 7";
    if (value) {
      // set the bit
      this.warningsBuffer.writeUInt8(this.warningsBuffer.readUInt8() | 128 >> bit % 8)
    } else {
      // clear the bit
      this.warningsBuffer.writeUInt8(this.warningsBuffer.readUInt8() & ~(128 >> bit % 8))
    }
    
  }
}

// const ecuDataStore = new Array(MAX_KEYS);
const ecuDataStore = new DataStore(); // just assign a big ass buffer
const updateValue = ({id, data}) => {

  // do any special handling depending on the new updated value
  switch (id) {
    case DATA_KEYS.FUEL_FLOW:
      // update fuel data
      break;
    // case DATA_KEYS.TARGET_AFR:
    //   break;
    // case DATA_KEYS.AFR_AVERAGE:
    //   break;
    // case DATA_KEYS.IGNITION_TIMING:
    //   break;
    // case DATA_KEYS.MAP:
    //   break;
    // case DATA_KEYS.MAT:
    //   break;
    // case DATA_KEYS.BAR_PRESSURE:
    //   break;
    case DATA_KEYS.CTS:
      ecuDataStore.updateWarning(WARNING_KEYS.ENGINE_TEMPERATURE, (data > ENGINE_TEMP_HIGH));
      break;
    case DATA_KEYS.OIL_PRESSURE:
      ecuDataStore.updateWarning(WARNING_KEYS.OIL_PRESSURE, (data < OIL_LOW_LIMIT));
      break;
    case DATA_KEYS.BATT_VOLTAGE:
      ecuDataStore.updateWarning(WARNING_KEYS.BATT_VOLTAGE, (data < VOLTAGE_LOW_LIMIT));
      break;
    default:
      break;
  }

  if (id < WARNING_KEYS.FIRST){
    // write data from CAN BUS  to store
    ecuDataStore.write(id, data);
  } else {
    ecuDataStore.updateWarning(id, data);
  }
}

const ecu = {

  /**
 * 
 * @returns {Buffer}
 */
  latestPacket: () => {
    return ecuDataStore.buffer;
  },

  /**
  * @param {{ ts: number; id: number; data: Uint8Array; ext: boolean; } | false} msg 
  */
  updateFromCanBus: (msg) => {
    if (msg === false) {
      // canparsing failure, shutdown
      ecuDataStore.updateWarning(WARNING_KEYS.ECU_COMM, true);
    } else {
      decoder.do(msg).forEach(newData => updateValue(newData));
    }
  },

  updateFromGPS: (msg) => {
    if (msg === false) {
      // canparsing failure, shutdown
      ecuDataStore.updateWarning(WARNING_KEYS.GPS_ERROR, true);
    } else {
      msg.forEach(newData => updateValue(newData));
    }
  },

}

export default ecu;