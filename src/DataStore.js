import { DATA_MAP, WARNING_KEYS } from "./dataKeys.js";
import { PacketEntry, TYPES } from "./lib/PacketEntry.js";
import RingBuffer from "./lib/ringBuffer.js";

// TODO: only generate packet entries for DATA KEYS we specifiy....(memory)
// but for now, anything in the datakey is generated, which is fine, the pi has plenty of memory
export default class DataStore {
  constructor() {

    // This it the order data is stored; mind the offset generated
    this.packetKeys = [];

    // auto generate packet entries for each key in datakeys
    for (const [_k, v] of Object.entries(DATA_MAP)) {
      this.packetKeys[v.id] = new PacketEntry(v.byteType)
    }
    this.buffer = Buffer.alloc(PacketEntry.TOTAL_OFFSET);
    
    // segmnet this out for easier access
    this.warningsBuffer = this.buffer.slice(
      this.packetKeys[DATA_MAP.WARNINGS.id].byteOffset,
      this.packetKeys[DATA_MAP.WARNINGS.id].byteOffset + this.packetKeys[DATA_MAP.WARNINGS.id].byteLength
    );
    // we will treat this like a queue FIFO
    this.averageMPGPoints = new RingBuffer(
      this.buffer.slice(
        this.packetKeys[DATA_MAP.AVERAGE_MPG_POINTS.id].byteOffset,
        this.packetKeys[DATA_MAP.AVERAGE_MPG_POINTS.id].byteOffset +
          this.packetKeys[DATA_MAP.AVERAGE_MPG_POINTS.id].byteLength
      )
    );
  }

  /**
   * @param {{ id: number; byte?: number; }} datakey
   * @param {number} value
   */
  write(datakey, value) {
    // TODO: keep map of datakeys written too; construct packet buffer from that
    
    const packetEntry = this.packetKeys[datakey.id];
    switch (packetEntry.byteType) {
      case TYPES.INT8:
        this.buffer.writeInt8(value, packetEntry.byteOffset);
        break;
      case TYPES.UINT8:
        this.buffer.writeUInt8(value, packetEntry.byteOffset);
        break;
      case TYPES.INT16:
        this.buffer.writeInt16BE(value, packetEntry.byteOffset);
        break;
      case TYPES.UINT16:
        this.buffer.writeUInt16BE(value, packetEntry.byteOffset);
        break;
      case TYPES.FLOAT:
        this.buffer.writeFloatBE(value, packetEntry.byteOffset);
        break;
      case TYPES.UINT32:
        this.buffer.writeUInt32BE(value, packetEntry.byteOffset);
        break;
      default:
        throw new Error("Critical Error: missed logic type");
    }
  }

  /**
   * @param {{ id: number; byteType: number; }} datakey
   */
  read(datakey) {
    const packetEntry = this.packetKeys[datakey.id];
    switch (packetEntry.byteType) {
      case TYPES.INT8:
        return this.buffer.readInt8(packetEntry.byteOffset);
      case TYPES.INT16:
        return this.buffer.readInt16BE(packetEntry.byteOffset);
      case TYPES.FLOAT:
        return this.buffer.readFloatBE(packetEntry.byteOffset);
      case TYPES.UINT8:
        return this.buffer.readUInt8(packetEntry.byteOffset);
      case TYPES.UINT16:
        return this.buffer.readUInt16BE(packetEntry.byteOffset);
      case TYPES.UINT32:
        return this.buffer.readUInt32BE(packetEntry.byteOffset);
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

  readWarning(warningBit) {
    if (warningBit > 7) throw "I screwed up: error - bit field key cannot be > 7";
    return (this.warningsBuffer.readUInt8() & (128 >> warningBit % 8)) !== 0;
  }

  update(dataKey, data) {
    if (dataKey.id < WARNING_KEYS.FIRST) {
      // write data from CAN BUS  to store
      this.write(dataKey, data);
    } else {
      this.updateWarning(dataKey.id, data);
    }
  }
}
