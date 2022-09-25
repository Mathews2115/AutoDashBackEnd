export class PacketEntry {
  static TOTAL_OFFSET = 0;
  constructor(type)  {
    this.byteType = type;
    switch (type) {
      case TYPES.INT8:
      case TYPES.UINT8:
        this.byteLength = 1;
        break;
      case TYPES.INT16:
      case TYPES.UINT16:
        this.byteLength = 2;
        break;
      case TYPES.FLOAT:
      case TYPES.UINT32:
        this.byteLength = 4;
        break;
      case TYPES.BITFIELD:
        this.byteLength = 1;
        break;
      case TYPES.SPECIAL_ARRAY:
        this.byteLength = 100;
        break;
      default:
        throw "Critical Error: missed logic type";
    }
    this.byteOffset = PacketEntry.TOTAL_OFFSET;
    PacketEntry.TOTAL_OFFSET += this.byteLength; // Update global offset
  }
}

export const TYPES = {
  INT8: 1,
  INT16: 2,
  FLOAT: 3,
  BITFIELD: 4,
  SPECIAL_ARRAY: 5, // 100 bytes
  UINT8: 6,
  UINT16: 7,
  UINT32: 8,
}