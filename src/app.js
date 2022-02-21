import DashSocketComms from './dashSocketComms.js'
import CanbusManager from './CAN/canbusManager.js'
import GPSManager from './GPS/gpsManager.js'
import ecuManager from './ecuManager.js'
import { appSettingsManager } from './appSettingsManager.js'
import DashContentWebServer from './webserver.js'

const UPDATE_MS = 33; //frequency  sent up to the dash  30fps (about 60hz)

// websockets config
const WS_PORT = 3333;
const WS_URL = ''

export default function (canChannel, settings) {
  const canComms = new CanbusManager(canChannel);
  const dashComms = new DashSocketComms(WS_URL, WS_PORT);
  const gps = new GPSManager(settings.gps);
  const ecu = ecuManager(settings.ecu);
  const appSettings = appSettingsManager(settings);
  const webserver = new DashContentWebServer('dist', 'index.html');
  let updateInterval = null;
  let savingUpdateInterval = null;

  const startApp = () => {
    try {
      const persistantData = appSettings.init();
      ecu.init(persistantData);
      dashComms.start();
      canComms.start(ecu.updateFromCanBus);
      gps.start(ecu.updateFromGPS);
      webserver.start();
      
      // Frontend update 
      updateInterval = setInterval(() => {
        dashComms.dashUpdate(ecu.latestPacket())
      }, UPDATE_MS);

      //file saving
      savingUpdateInterval = setInterval(() => {
        appSettings.saveSettings(ecu.persistantData);
      }, 1000);
    } catch (error) {
      onError(error);
    }
  }

  const onError = (error) => {
    console.error(error);
    // if catchable error occurred, attempt to gracefully stop everything first
    if(dashComms && dashComms.started) {
      dashComms.notifyError();
    }
    stopApp();
  }

  const stopApp = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    updateInterval = null;

    if(savingUpdateInterval) {
      clearInterval(savingUpdateInterval);
    }
    savingUpdateInterval = null;

    console.log(" -------- Stopping Dash Server   -------------");
    if (dashComms && dashComms.started) dashComms.stop();
    if (canComms && canComms.started) canComms.stop();
    if (gps && gps.started) gps.stop();
    ecu.stop();
    console.log(" -------- STOPPED   -------------");
  }
  
  const app =  {
    TYPES: {
      DEVELOPMENT: 'development',
      LIVE: 'live'
    },

    /**
     * Starts the all comms (listening to the car CAN, talking to the dash client)
     * @param {string} type 
     */
    start: startApp,
    stop: stopApp,
  }

  return app;
}
