import FrontEndWebServer from './webserver.js'
import DashSocketComms from './dashSocketComms.js'
import CanbusManager from './canbusManager.js'
import GPSManager from './gpsManager.js'

// front end web server config
const FRONT_END_PATH = '/public/dist'
const ENTRY_POINT = 'index.html'
const FRONT_END_PORT = 8080;
const UPDATE_MS = 33; //frequency  sent up to the dash  30fps (about 60hz)

// websockets config
const WS_PORT = 3333;
const WS_URL = ''


export default function (canChannel, settings) {
  const canComms = new CanbusManager(canChannel);
  const frontendServer = {} //new FrontEndWebServer(FRONT_END_PATH, ENTRY_POINT);
  const dashComms = new DashSocketComms(WS_URL, WS_PORT);
  const gps = new GPSManager(settings.gps);
  let updateInterval = null;
  
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
        gps.start();
        
        // Update 
        updateInterval = setInterval(() => {
          let gpsPacket = gps.getLatestPacket();
          let canPacket = canComms.getLatestPacket();
          // todo:
          // structure packet as such:
          // [GPS PACKET: [0]: data byte length | [1]: data ...byte-length]
          // [CAN PACKET: [0]: data ... buffer length]

          dashComms.dashUpdate(canPacket)
        }, UPDATE_MS);

      } catch (error) {
        // if catchable error occurred, attempt to gracefully stop everything first
        if(dashComms && dashComms.started) {
          dashComms.notifyError();
        }
        stop();
      }
    },

    stop: () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      updateInterval = null;
  
      console.log(" -------- Stopping Dash Server   -------------");
      if (frontendServer && frontendServer.started) frontendServer.stop();
      if (dashComms && dashComms.started) dashComms.stop();
      if (canComms && canComms.started) canComms.stop();
      if (gps && gps.started) gps.stop();
      console.log(" -------- STOPPED   -------------");
    }
  }

  return app;
}
