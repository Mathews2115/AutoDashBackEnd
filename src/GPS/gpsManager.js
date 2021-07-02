import SerialPort from 'serialport';
import UBXProtocolParser from './ubx/UbxProtocolParser.js';
import UBXPacketParser from './ubx/UbxPacketParser.js';
import { DATA_KEYS, WARNING_KEYS } from '../dataKeys.js';

class GPSManager {
  constructor(settings) {
    this.port = null;
    this.baudrate = settings.baudRate || 9600;
    this.port = settings.port || '';
    this.started = false;
  }

  parse(data) {
    switch (data.type) {
      case 'NAV-STATUS':
        return [{ id: WARNING_KEYS.GPS_NOT_ACQUIRED, data: !data.data.flags.gpsFixOk}]
  
      case 'NAV-VELNED':
        return [{ id: DATA_KEYS.GPS_SPEEED, data: (Math.min(255, Math.floor(data.data.gSpeed*0.022369)), 0)}, // cm/s to mph;\
         {id: DATA_KEYS.HEADING, data:  data.data.heading}]
 
      case 'NAV-ODO':
        return [{ id: DATA_KEYS.ODOMETER, data: Math.floor(data.data.totalDistance*0.000621371)},
         { id: DATA_KEYS.TRIP_ODOMETER, data: Math.floor(data.data.distance*0.000621371)}]
  
      default:
        return [];
    }
  }

   /**
   * Starts listening to the canbus - collect data into a dictionary;
   * @param {Function} [onUpdateCallback]
   */
  start(onUpdateCallback) {
    try {
      const onError = (err) => {
        console.log(err);
        onUpdateCallback(false)
      }
      
      this.port = new SerialPort(this.port, { baudRate: this.baudrate,  autoOpen: false })

      const ubxProtocolParser = new UBXProtocolParser();
      const ubxPacketParser = new UBXPacketParser();
      ubxProtocolParser.pipe(ubxPacketParser);
      ubxPacketParser.on('data', (data) => { 
        onUpdateCallback(this.parse(data));
      });

      this.port.on('error', (e) => { onError(e); });
      this.port.on('close', (d) => { console.log(d); });
      this.port.open((err) => {
        let error = !!err;
        if (!error) {
          this.started = true;
        } else {
          console.log("ERROR: could not connect to GPS hardware: ", err);
          onError();
        } 
        return this.port.pipe(ubxProtocolParser);
      });
    } catch (error) {
      console.log("ERROR: GPS could not initialize: ", error);
      throw error;
    }
  }
  
  stop() {
    if (this.port) {
      this.port.close();
      this.port = null;
    }
    this.started = false;
  }
}

export default GPSManager;