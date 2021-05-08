//https://github.com/uNetworking/uWebSockets.js 
import uWS from 'uWebSockets.js'

class DashSocketComms {
  constructor (url, port) {
    this.listenSocket = null;
    this.url = url;
    this.port = port;
    this.started = false;

    this.open = (ws) => {
      console.log('A WebSocket connected!');
      ws.subscribe('#'); //just subscribe to everything for now; ill boost this up at some point
    }
    this.message = (ws, message, isBinary) => {
      console.log('WebSocket message received from dash', message);
      /* Ok is false if backpressure was built up, wait for drain */
      // let ok = ws.send(message, isBinary);
    }
    this.drain = (ws) => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
    }
    this.close = (ws, code, message) => {
      console.log('WebSocket closed');
    }

    this.uWSApp = uWS.App({}).ws('/*', {
      compression: uWS.DISABLED,
      // maxPayloadLength: 16 * 1024 * 1024,
      idleTimeout: 5,
      /* Handlers */
      open: this.open,
      message: this.message,
      drain: this.drain,
      close: this.close,
    })
  }

  /**
   * @param {Buffer} canPacket - array of 32Unit ID | 16UInt length of data | data...
   */
  canUpdate(canPacket) {
    this.uWSApp.publish("can_update",
    new Uint8Array(canPacket.buffer, canPacket.byteOffset, canPacket.length), 
     true);
  }

  notifyError() {
    this.uWSApp.publish("error", "onno");
  }

  start() {
    this.started = true;
    this.uWSApp.listen(this.port, (token) => {
      if (token) {
        this.listenSocket = token;
        console.log('Listening to port ' + this.port);
      } else {
        console.log('Failed to listen to port ' + this.port);
      }
    })
  }
  stop() {
    this.started = false;
    if(this.listenSocket) {
      uWS.us_listen_socket_close(this.listenSocket);
      this.listenSocket = null;
    }
  }
}

export default DashSocketComms;