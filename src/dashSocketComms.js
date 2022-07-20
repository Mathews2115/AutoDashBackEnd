// https://github.com/uNetworking/uWebSockets.js
import uWS from 'uWebSockets.js';

class DashSocketComms {
  constructor(url, port) {
    this.listenSocket = null;
    this.url = url;
    this.port = port;
    this.started = false;
    this.sockets = []

    this.open = (ws) => {
      this.sockets.push(ws);
      console.log('AutoDash: A dash has been found - A WebSocket connected!');
      ws.subscribe('#'); // just subscribe to everything for now; ill boost this up at some point
    };
    this.message = (ws, message, isBinary) => {
      // console.log('WebSocket message received from dash', message);
      /* Ok is false if backpressure was built up, wait for drain */
      // let ok = ws.send(message, isBinary);
    };
    this.drain = (ws) => {
      // console.log(`WebSocket backpressure: ${ws.getBufferedAmount()}`);
    };
    this.close = (ws, code, message) => {
      const i = this.sockets.findIndex(s => s === ws);
      if (i >= 0) {
        this.sockets.splice(i, 1);
      }
      console.log('AutoDash: someone disconnected!');
    };

    this.uWSApp = uWS.App({}).ws('/*', {
      compression: uWS.DISABLED,
      // maxPayloadLength: 16 * 1024 * 1024,
      idleTimeout: 8,
      /* Handlers */
      open: this.open,
      message: this.message,
      drain: this.drain,
      close: this.close,
    });
  }

  /**
   * @param {Buffer} packet - array of 32Unit ID | 16UInt length of data | data...
   */
  dashUpdate(packet) {
    this.sockets.forEach(ws => { ws.send(new Uint8Array(packet.buffer, packet.byteOffset, packet.length), true) });
    // this.uWSApp.publish(
    //   'data_update',
    //   new Uint8Array(packet.buffer, packet.byteOffset, packet.length),
    //   true,
    // );
  }

  notifyError() {
    this.uWSApp.publish('error', 'onno');
  }

  start() {
    this.started = true;
    this.uWSApp.listen(this.port, (token) => {
      if (token) {
        this.listenSocket = token;
        console.log(`AutoDash: Listening to port ${this.port}`);
      } else {
        console.log(`AutoDash: !!!FAILED to listen to port ${this.port}`);
      }
    });
  }

  stop() {
    this.started = false;
    if (this.listenSocket) {
      uWS.us_listen_socket_close(this.listenSocket);
      this.listenSocket = null;
      console.log("AutoDash closing websocket");
    }
  }
}

export default DashSocketComms;
