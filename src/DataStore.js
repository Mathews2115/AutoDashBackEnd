import { DATA_KEYS, WARNING_KEYS } from "./dataKeys.js";
import { PacketEntry, TYPES } from "./lib/PacketEntry.js";
import RingBuffer from "./lib/ringBuffer.js";

export default class DataStore {
  constructor() {
    // This it the order data is stored; mind the offset generated
    this.packetKeys = [];
    this.packetKeys[DATA_KEYS.PEDAL_POSITION] = new PacketEntry(TYPES.ONE_BYTE); // xxx percent
    this.packetKeys[DATA_KEYS.RPM] = new PacketEntry(TYPES.TWO_BYTES); // xx,xxx
    // Fuel Flow  x,xxx pounds/hour
    this.packetKeys[DATA_KEYS.FUEL_FLOW] = new PacketEntry(TYPES.TWO_BYTES);
    this.packetKeys[DATA_KEYS.TARGET_AFR] = new PacketEntry(TYPES.FLOAT); // xx.x A/F
    this.packetKeys[DATA_KEYS.AFR_AVERAGE] = new PacketEntry(TYPES.FLOAT); // xx.x A/F
    this.packetKeys[DATA_KEYS.IGNITION_TIMING] = new PacketEntry(TYPES.FLOAT); // xx.x degrees
    this.packetKeys[DATA_KEYS.MAP] = new PacketEntry(TYPES.TWO_BYTES); // xxx kPa
    this.packetKeys[DATA_KEYS.MAT] = new PacketEntry(TYPES.TWO_BYTES); // xxx F
    this.packetKeys[DATA_KEYS.CTS] = new PacketEntry(TYPES.TWO_BYTES); // xxx F
    this.packetKeys[DATA_KEYS.BAR_PRESSURE] = new PacketEntry(TYPES.FLOAT); // xxx.x kPa
    this.packetKeys[DATA_KEYS.OIL_PRESSURE] = new PacketEntry(TYPES.TWO_BYTES); // xxx   psi
    this.packetKeys[DATA_KEYS.BATT_VOLTAGE] = new PacketEntry(TYPES.FLOAT); // xx.x volts
    this.packetKeys[DATA_KEYS.WARNINGS] = new PacketEntry(TYPES.BITFIELD);
    this.packetKeys[DATA_KEYS.ODOMETER] = new PacketEntry(TYPES.TWO_BYTES);
    // its gonna roll over early, lol - ill fix this at some point
    this.packetKeys[DATA_KEYS.TRIP_ODOMETER] = new PacketEntry(TYPES.TWO_BYTES);
    this.packetKeys[DATA_KEYS.GPS_SPEEED] = new PacketEntry(TYPES.TWO_BYTES);
    this.packetKeys[DATA_KEYS.FUEL_LEVEL] = new PacketEntry(TYPES.ONE_BYTE);
    this.packetKeys[DATA_KEYS.CURRENT_MPG] = new PacketEntry(TYPES.FLOAT);
    this.packetKeys[DATA_KEYS.AVERAGE_MPG] = new PacketEntry(TYPES.FLOAT);
    // array of average mpg values
    this.packetKeys[DATA_KEYS.AVERAGE_MPG_POINTS] = new PacketEntry(TYPES.SPECIAL_ARRAY);
    this.packetKeys[DATA_KEYS.AVERAGE_MPG_POINT_INDEX] = new PacketEntry(TYPES.ONE_BYTE);
    this.packetKeys[DATA_KEYS.LOW_LIGHT_DETECTED] = new PacketEntry(TYPES.ONE_BYTE);

    this.buffer = Buffer.alloc(Math.max(1024, PacketEntry.OFFSET));
    this.warningsBuffer = this.buffer.slice(
      this.packetKeys[DATA_KEYS.WARNINGS].byteOffset,
      this.packetKeys[DATA_KEYS.WARNINGS].byteOffset + this.packetKeys[DATA_KEYS.WARNINGS].byteLength
    );
    // we will treat this like a queue FIFO
    this.averageMPGPoints = new RingBuffer(
      this.buffer.slice(
        this.packetKeys[DATA_KEYS.AVERAGE_MPG_POINTS].byteOffset,
        this.packetKeys[DATA_KEYS.AVERAGE_MPG_POINTS].byteOffset +
          this.packetKeys[DATA_KEYS.AVERAGE_MPG_POINTS].byteLength
      )
    );
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
        throw new Error("Critical Error: missed logic type");
    }
  }

  read(key) {
    switch (this.packetKeys[key].type) {
      case TYPES.ONE_BYTE:
        return this.buffer.readInt8(this.packetKeys[key].byteOffset);
      case TYPES.TWO_BYTES:
        return this.buffer.readInt16BE(this.packetKeys[key].byteOffset);
      case TYPES.FLOAT:
        return this.buffer.readFloatBE(this.packetKeys[key].byteOffset);
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
      this.warningsBuffer.writeUInt8(
        this.warningsBuffer.readUInt8() | (128 >> bit % 8)
      );
    } else {
      // clear the bit
      this.warningsBuffer.writeUInt8(
        this.warningsBuffer.readUInt8() & ~(128 >> bit % 8)
      );
    }
  }

  readWarning(id) {
    const bit = id - WARNING_KEYS.FIRST;
    if (bit > 7) throw "I screwed up: error - bit field key cannot be > 7";
    return (this.warningsBuffer.readUInt8() & (128 >> bit % 8)) !== 0;
  }
}
