//https://github.com/uNetworking/uWebSockets.js 
// version 18.7.0 - for node 14 compadiblity
import uWS from 'uWebSockets.js'

class SocketServer {
  constructor (url, port) {
    this.listenSocket = null;
    this.url = url;
    this.port = port;
    this.started = false;

    this.open = (ws) => {
      console.log('A WebSocket connected!');
    }
    this.message = (ws, message, isBinary) => {
      console.log('WebSocket message', message);
      /* Ok is false if backpressure was built up, wait for drain */
      let ok = ws.send(message, isBinary);
    }
    this.drain = (ws) => {
      console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
    }
    this.close = (ws, code, message) => {
      console.log('WebSocket closed');
    }

    this.uWSApp = uWS.App({}).ws('/*', {
      // compression: uWS.SHARED_COMPRESSOR,
      // maxPayloadLength: 16 * 1024 * 1024,
      // idleTimeout: 10,
      /* Handlers */
      open: this.open,
      message: this.messge,
      drain: this.drain,
      close: this.close,
    })
  }

  notifyClient(type, data) {
    this.uWSApp.publish(type, data, true);
  }

  notifyError() {

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
      this.uWSApp.stop();
    }
  }
}

export default SocketServer;