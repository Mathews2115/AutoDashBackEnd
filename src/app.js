import FrontEndWebServer from './webserver.js'
import SocketServer from './socketServer.js'

// front end web server config
const FRONT_END_PATH = '/public/dist'
const ENTRY_POINT = 'index.html'
const FRONT_END_PORT = 8080;

// websockets config
const WS_PORT = 3333;
const WS_URL = ''

export default function () {
  //const frontendServer = new FrontEndWebServer(FRONT_END_PATH, ENTRY_POINT);
  const socketServer = new SocketServer(WS_URL, WS_PORT);

  const app =  {
    TYPES: {
      DEVELOPMENT: 'development',
      LIVE: 'live'
    },
    start: (type, canChannel) => {
      if (type !== app.TYPES.DEVELOPMENT) {
        frontendServer.start();
      }
      socketServer.start();
      //canServer.start(canChannel)
    },
    stop: () => {
      frontendServer.stop();
      socketServer.stop();
    }
  }

  return app;
}
