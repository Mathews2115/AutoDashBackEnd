import can from 'socketcan'

class SocketServer {
  /**
   * Listens to can messges
   * @param {string} channel - Example: vcan0 | can0 | can1
   */
  constructor (channel) {
    try {
      this.channel =  can.createRawChannel(channel, true);
      // CAN MESSAGE RECEIVED
      // store all messages into mini database - to be sent in one big packet per 'frame'
      // msg: {ts: number, id: number, data: NodeBuffer}
      this.channel.addListener("onMessage", (msg) => { 
        console.log(msg); 
      });
    } catch (error) {
      console.error('ERROR: Cannot create can channel - did you raise the interface?')
      console.error(error);
      throw error;
    } 
  }

  start() {
    try {
      this.channel.start();
      this.started = true;
    } catch (error) {
      console.log("ERROR: SocketServer: ", error);
    }
    return this.started;
  }

  stop() {
    this.started = false;
    this.channel.stop();
  }
}

export default SocketServer;
