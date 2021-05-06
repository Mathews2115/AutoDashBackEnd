import can from 'socketcan'

// Example data;
// ts_sec: 1619982309,
// ts_usec: 809681,
// id: 505189072,
// ext: true,
// data: <Buffer 80 00 00 00 00 00 00 00>
const HERTZ = 17;
const HEADER_BYTE_LENGTH = 5; // bytes

/**
 * 
 * @param {Buffer} msg 
 */
const defaultCallback = (msg) => {}

class CanbusManager {
  /**
   * Listens to can messges
   * @param {string} channel - Example: vcan0 | can0 | can1
   */
  constructor (channel) {
    try {
      this.db = Array(10000);  // (4 bytes * 100 = reserved space) a mini-db that contains all of our current CAN data, key is CAN-ID, value is binary data
      this.keys = new Set();   // this Set indicates what messages we've received this "frame".  This is cleared once we've sent the data up to the client.
      
      this.signal = null;
      this.callback = defaultCallback;
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
   * Starts listening to the canbus - the callback will be called for each message with the provided data
   * @param {{ (canPacket: Buffer): void; (msg: Buffer): void; }} callback
   */
  start(callback) {
    let framePacketLength = 0;

    try {
      this.callback = callback;
      this.channel.start();
      this.signal = setInterval(() => {
        // data we will be sending up - it will be combined into a single packet
        let buffers = [];

        // total length of packet
        framePacketLength = 0;

        this.keys.forEach((key, _value, _set) => {
          // allocate space for ID + data's byte_length + actual data
          const buf = Buffer.allocUnsafe(HEADER_BYTE_LENGTH + Buffer.byteLength(this.db[key]));

          // can ID
          buf.writeUInt32BE(key, 0);

          // can length
          buf.writeUInt8(Buffer.byteLength(this.db[key]), 2);

          // copy can data (target, target_start, source start)
          this.db[key].copy(buf, HEADER_BYTE_LENGTH, 0);

          buffers.push(buf);
          framePacketLength += buf.length;
        })

        if (framePacketLength) {
          let packet = Buffer.concat(buffers, framePacketLength);
          // send frame packet to anyone connected with us
          this.callback(packet);
        }

        this.keys.clear();
      }, HERTZ);
      this.started = true;
    } catch (error) {
      console.error("ERROR: SocketServer: ", error);
      this.stop();
    }
    return this.started;
  }

  stop() {
    if (this.signal) {
      clearInterval(this.signal);
    }
    this.callback = defaultCallback;
    this.started = false;
    this.channel.stop();
  }
}

export default CanbusManager;
