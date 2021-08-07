export class PacketEntry {
  static OFFSET = 0;
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
      case TYPES.SPECIAL_ARRAY:
        this.byteLength = 100;
        break;
      default:
        throw "Critical Error: missed logic type";
    }
    this.byteOffset = PacketEntry.OFFSET;
    PacketEntry.OFFSET += this.byteLength; // Update global offset
  }
}

export const TYPES = {
  ONE_BYTE: 1,
  TWO_BYTES: 2,
  FLOAT: 3,
  BITFIELD: 4,
  SPECIAL_ARRAY: 5
}