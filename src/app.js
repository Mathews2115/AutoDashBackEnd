import FrontEndWebServer from './webserver.js'
import SocketServer from './socketServer.js'
import CanServer from './canServer.js'

// front end web server config
const FRONT_END_PATH = '/public/dist'
const ENTRY_POINT = 'index.html'
const FRONT_END_PORT = 8080;

// websockets config
const WS_PORT = 3333;
const WS_URL = ''

export default function (canChannel) {
  //const frontendServer = new FrontEndWebServer(FRONT_END_PATH, ENTRY_POINT);
  const dashComms = new SocketServer(WS_URL, WS_PORT);
  const canComms = new CanServer(canChannel);
  const app =  {
    TYPES: {
      DEVELOPMENT: 'development',
      LIVE: 'live'
    },

    /**
     * Starts the all comms (listening to the car CAN, talking to the dash client)
     * @param {string} type 
     */
    start: (type) => {
      try {
        if (type !== app.TYPES.DEVELOPMENT) {
          frontendServer.start();
        }
        dashComms.start();
        canComms.start();
      } catch (error) {
        if(dashComms && dashComms.started) {
          dashComms.notifyError();
          dashComms.stop();
        }
      }
    },

    stop: () => {
      console.log(" -------- Stopping Dash Server   -------------")
      if (frontendServer && frontendServer.started) frontendServer.stop();
      if (dashComms && dashComms.started) dashComms.stop();
      if (canComms && canComms.started) canComms.stop();
    }
  }

  return app;
}
