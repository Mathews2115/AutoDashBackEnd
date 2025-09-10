import DashSocketComms from './dashSocketComms.js'
import CanbusManager from './CAN/canbusManager.js'
import GPSManager from './GPS/gpsManager.js'
import ecuManager from './ecuManager.js'
import DashContentWebServer from './webserver.js'
import DataPersister from './DataPersister.js'

const UPDATE_MS = 33; //frequency  sent up to the dash  30fps (about 60hz)

const APP_SETTINGS_LOCATION = './settings/appSettings.json';
let stopping = false;

// websockets config
const WS_PORT = 3333;
const WS_URL = ''

export default function (envSettings, appSettings) {
  const canComms = new CanbusManager(envSettings.canChannel);
  const dashComms = new DashSocketComms(WS_URL, WS_PORT);
  const gps = new GPSManager(appSettings.gps);
  const persister = new DataPersister(APP_SETTINGS_LOCATION);
  const ecu = ecuManager(appSettings.ecu, envSettings.canChannel);
  const webserver = new DashContentWebServer('dist', 'index.html');
  let updateInterval = null;

  const startApp = () => {
    try {
      console.log("AutoDash:-----------STARTING AUTODASH-------------")
      ecu.init(persister.read());
      dashComms.start();
      canComms.start(ecu.updateFromCanBus);
      startGPS(appSettings, gps, ecu)
      webserver.start();
      updateInterval = startDashUpdates(updateInterval, dashComms, ecu)
      startFilePersisting(appSettings, persister, ecu)
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
    if (stopping) return;
    stopping = true;
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    updateInterval = null;

    console.log(" -------- Stopping Dash Server   -------------");
    persister.stop();
    if (dashComms && dashComms.started) dashComms.stop();
    if (canComms && canComms.started) canComms.stop();
    if (gps && gps.started) gps.stop();
    ecu.stop();
    webserver.stop();
    console.log("AutoDash: -------- STOPPED   -------------");
  }

  const app =  {
    start: startApp,
    stop: stopApp,
  }

  return app;
}

function startDashUpdates(updateInterval, dashComms, ecu) {
  updateInterval = setInterval(() => {
    dashComms.dashUpdate(ecu.latestPacket())
  }, UPDATE_MS)
  return updateInterval
}

/**
 * @param {{ gps: { enabled: any; }; }} settings
 * @param {GPSManager} gps
 */
function startGPS(settings, gps, ecu) {
  if (settings.gps.enabled) {
    gps.start(ecu.updateFromGPS)
  } else {
    console.log('AutoDash: GPS disabled')
  }
}

/**
 * @param {{ ecu: { persist: any; }; }} settings
 * @param {DataPersister} persister
 */
function startFilePersisting(settings, persister, ecu) {
  if (settings.ecu.persist) {
    persister.start(ecu.persistantData())
  } else {
    console.log('AutoDash: No persisting data')
  }
}

