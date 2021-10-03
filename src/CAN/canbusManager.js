import can from 'socketcan'

// Example data;
// ts_sec: 1619982309,
// ts_usec: 809681,
// id: 505189072,
// ext: true,
// data: <Buffer 80 00 00 00 00 00 00 00>
/**
 * Strictly handles the communication with CANBUS
 */
let timeout = null;
class CanbusManager {
  /**
   * Listens to can messges
   * @param {string} channel - Example: vcan0 , can0 , can1
   */
  constructor(channel) {
    this.started = false;
    this.channelName = channel;
    
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
    this.onUpdateCallback = onUpdateCallback;

    try {
      this.channel = can.createRawChannel(this.channelName, true);
    } catch (error) {
      console.error('ERROR: Cannot create can channel - did you raise the interface?')
      console.error(error);
    }

    try {
      if (this.channel) {
        this.resetTimeout();
        this.channel.start();
        this.channel.addListener('onMessage', (msg) => {
          this.resetTimeout();
          this.onUpdateCallback(msg);
        });
        this.started = true;
      }
    } catch (error) {
      console.error('ERROR: SocketServer: ', error);
      this.stop();
    }
    return this.started;
  }

  stop() {
    clearTimeout(timeout);
    this.onUpdateCallback(false);
    this.started = false;
    if(this.channel) this.channel.stop();
    this.channel = null;
  }

  resetTimeout() {
    if (this.onUpdateCallback) {
      clearTimeout(timeout);
      timeout = setTimeout(() => { this.onUpdateCallback(false) }, 3000);
    }
  }
}

export default CanbusManager;
