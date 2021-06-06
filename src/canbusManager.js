import can from 'socketcan'

// Example data;
// ts_sec: 1619982309,
// ts_usec: 809681,
// id: 505189072,
// ext: true,
// data: <Buffer 80 00 00 00 00 00 00 00>
const HEADER_BYTE_LENGTH = 5; // bytes

class CanbusManager {
  /**
   * Listens to can messges
   * @param {string} channel - Example: vcan0 , can0 , can1
   */
  constructor (channel) {
    // cached for when we get packet data (havent tested but assuming to lower GC)
    this.framePacketLength = 0;
    this.byteLength = 0;
    this.started = false;

    try {
      this.db = Array(10000);  // (4 bytes * 100 = reserved space) a mini-db that contains all of our current CAN data, key is CAN-ID, value is binary data
      this.keys = new Set();   // this Set indicates what messages we've received this "frame".  This is cleared once we've sent the data up to the client.

      this.channel =  can.createRawChannel(channel, true);
      this.channel.addListener("onMessage", (msg) => this.canMessageReceived(msg));
    } catch (error) {
      console.error('ERROR: Cannot create can channel - did you raise the interface?')
      console.error(error);
      throw error;
    } 
  }

  /**
  * store all messages into mini database - to be sent in one big packet per 'frame'
  * @param {{ ts: number; id: number; data: Uint8Array; ext: boolean; }} msg 
  */
  canMessageReceived(msg) {
    this.db[msg.id] = msg.data;

    // save for our frame packet
    if (!this.keys.has(msg.id)) {
      this.keys.add(msg.id)
    }
  }

  /**
   * Starts listening to the canbus - collect data into a dictionary;
   */
  start() {
    try {
      this.channel.start();
      this.started = true;
    } catch (error) {
      console.error("ERROR: SocketServer: ", error);
      this.stop();
    }
    return this.started;
  }

  getLatestPacket() {
    // data we will be sending up - it will be combined into a single packet
    let buffers = [];

    // total length of packet
    this.framePacketLength = 0;

    this.keys.forEach((key, _value, _set) => {
      this.byteLength = Buffer.byteLength(this.db[key])

      // allocate space for ID + data's byte_length + actual data
      const buf = Buffer.allocUnsafe(HEADER_BYTE_LENGTH + this.byteLength);

      // can ID ( 4 bytes )
      buf.writeUInt32BE(key, 0);

      // can length ( 1 byte )
      buf.writeUInt8(this.byteLength, 4);

      // copy can data (target, target_start, source start) ( 8 bytes)
      this.db[key].copy(buf, HEADER_BYTE_LENGTH, 0);

      buffers.push(buf);
      this.framePacketLength += buf.length;
    })

    this.keys.clear();
    return Buffer.concat(buffers, this.framePacketLength)
  }

  stop() {
    this.started = false;
    this.channel.stop();
  }
}

export default CanbusManager;
