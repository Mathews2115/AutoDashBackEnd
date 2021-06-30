import can from 'socketcan'

// Example data;
// ts_sec: 1619982309,
// ts_usec: 809681,
// id: 505189072,
// ext: true,
// data: <Buffer 80 00 00 00 00 00 00 00>
const HEADER_BYTE_LENGTH = 5; // bytes

/**
 * Strictly handles the communication with CANBUS
 */
class CanbusManager {
  /**
   * Listens to can messges
   * @param {string} channel - Example: vcan0 , can0 , can1
   */
  constructor (channel) {
    this.started = false;
    this.onUpdateCallback = () => {}
    try {
      this.channel =  can.createRawChannel(channel, true);
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

  /**
   * Starts listening to the canbus - collect data into a dictionary;
   * @param {Function} [onUpdateCallback]
   */
  start(onUpdateCallback) {
    try {
      this.channel.start();
      this.channel.addListener("onMessage", (msg) => {
        onUpdateCallback(msg);
      });
      this.started = true;
    } catch (error) {
      console.error("ERROR: SocketServer: ", error);
      this.stop();
      onUpdateCallback(false);
    }
    return this.started;
  }

  // getLatestPacket() {
  //   // data we will be sending up - it will be combined into a single packet
  //   let buffers = [];

  //   // total length of packet
  //   this.framePacketLength = 0;

  //   this.keys.forEach((key, _value, _set) => {
  //     this.byteLength = Buffer.byteLength(this.db[key])

  //     // allocate space for ID + data's byte_length + actual data
  //     const buf = Buffer.allocUnsafe(HEADER_BYTE_LENGTH + this.byteLength);

  //     // can ID ( 4 bytes )
  //     buf.writeUInt32BE(key, 0);

  //     // can length ( 1 byte )
  //     buf.writeUInt8(this.byteLength, 4);

  //     // copy can data (target, target_start, source start) ( 8 bytes)
  //     this.db[key].copy(buf, HEADER_BYTE_LENGTH, 0);

  //     buffers.push(buf);
  //     this.framePacketLength += buf.length;
  //   })

  //   this.keys.clear();
  //   return Buffer.concat(buffers, this.framePacketLength)
  // }

  stop() {
    this.started = false;
    this.channel.stop();
  }
}

export default CanbusManager;
