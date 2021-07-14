import racePackDecoder from "./CAN/racepakDecoder.js";
import {DATA_KEYS, WARNING_KEYS} from "./dataKeys.js"
import {performance} from "perf_hooks";

const decoder = racePackDecoder; // alias
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

    this.packetKeys[DATA_KEYS.ODOMETER] = new PacketEntry(TYPES.TWO_BYTES); 
    this.packetKeys[DATA_KEYS.TRIP_ODOMETER] = new PacketEntry(TYPES.TWO_BYTES); //its gonna roll over early, lol - ill fix this at some point
    this.packetKeys[DATA_KEYS.GPS_SPEEED] = new PacketEntry(TYPES.TWO_BYTES); 
    this.packetKeys[DATA_KEYS.FUEL_LEVEL] = new PacketEntry(TYPES.ONE_BYTE);
    this.packetKeys[DATA_KEYS.CURRENT_MPG] = new PacketEntry(TYPES.FLOAT);
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

  read(key) {
    switch (this.packetKeys[key].type) {
      case TYPES.ONE_BYTE:
        return this.buffer.readInt8(this.packetKeys[key].byteOffset);;
      case TYPES.TWO_BYTES:
        return  this.buffer.readInt16BE(this.packetKeys[key].byteOffset);
      case TYPES.FLOAT:
        return this.buffer.readFloatBE(this.packetKeys[key].byteOffset);
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

export default (carSettings) => {
let msSample = 0;
let lastFuelSample = 0; // Last Gal / Millisecond sample
const ecuDataStore = new DataStore(); // just assign a big ass buffer
let gallonsLeft = carSettings.tank_size;

const init = () => {
  ecuDataStore.write(DATA_KEYS.FUEL_LEVEL, 100); // percent - for now, until we save out our level to HDD
  msSample = performance.now();
}

const updateValue = ({id, data}) => {

  // do any special handling depending on the new updated value
  switch (id) {
    case DATA_KEYS.FUEL_FLOW:
      const newMsSample = performance.now();
      const msDelta = newMsSample - msSample; // ms since last sample

      //  calculate fuel consumption based on the last sample
      const gpMs = (data * 0.1621) / 3600000; // convert from pounds/hour to gal/hour, then to to gal/millisecond
      const pMin =  Math.min(lastFuelSample, gpMs);
      const pMax =  Math.max(lastFuelSample, gpMs);
      const gallonsConsumed = ((msDelta * (pMax - pMin)) / 2) + (msDelta*pMin);

      // update the fuel level
      gallonsLeft -= gallonsConsumed;

      // distance (m) = speed (m/millisecond) * time (ms)
      // calculate distance since last sample
      const distance = (ecuDataStore.read(DATA_KEYS.GPS_SPEEED)/3600000) * msDelta;

      // write current MPG  
      ecuDataStore.write(DATA_KEYS.CURRENT_MPG, distance / gallonsConsumed);

      // write percent fuel left
      ecuDataStore.write(DATA_KEYS.FUEL_LEVEL, Math.floor((gallonsLeft/carSettings.tank_size)* 100));
      msSample = newMsSample;
      lastFuelSample = gpMs;
      break;
    // case DATA_KEYS.PEDAL_POSITION:
    //   break;
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
      ecuDataStore.updateWarning(WARNING_KEYS.ENGINE_TEMPERATURE, (data > carSettings.engine_temp_high));
      break;
    case DATA_KEYS.OIL_PRESSURE:
      // not connected yets
      // ecuDataStore.updateWarning(WARNING_KEYS.OIL_PRESSURE, (data < carSettings.oil_low_limit));
      break;
    case DATA_KEYS.BATT_VOLTAGE:
      ecuDataStore.updateWarning(WARNING_KEYS.BATT_VOLTAGE, (data < carSettings.voltage_low_limit));
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
  } else {
    msg.forEach(newData => updateValue(newData));
    return gpsUpdate;
  }
}

/**
 * turns off GPS error; updates GPS data
 * Returns updater callback to be used next time
 * @returns {Function}
 */
const gpsUpdateStateToWorking = (msg) => {
  if(msg) {
    ecuDataStore.updateWarning(WARNING_KEYS.GPS_ERROR, false);
    return gpsUpdate(msg);
  } else {
    return gpsUpdateStateToWorking;
  }
}

/**
 * Turns GPS error on
 * Returns updater callback to be used next time
 * @returns {Function}
 */
const gpsUpdateStateToBroked = (msg) => {
  ecuDataStore.updateWarning(WARNING_KEYS.GPS_ERROR, true);
  return gpsUpdateStateToWorking;
}

/** @type {Function} */
let gpsUpdater = gpsUpdate;

const ecu = {
  init: init,
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

  // Updates GPS data, if error, will turn error off on next successful update
  updateFromGPS: (msg) => {
    gpsUpdater = gpsUpdater(msg);
  },
}


  return ecu;
}
