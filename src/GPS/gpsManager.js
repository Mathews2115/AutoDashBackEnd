import SerialPort from 'serialport';
import UBXProtocolParser from './ubx/UbxProtocolParser.js';
import UBXPacketParser from './ubx/UbxPacketParser.js';
import { DATA_KEYS, WARNING_KEYS } from '../dataKeys.js';

class GPSManager {
  /**
   * @param {{ baudRate: number; port: string; }} settings
   */
  constructor(settings) {
    /** @type {SerialPort} */
    this.port = null;
    this.baudrate = settings.baudRate || 9600;
    this.portName = settings.port || '';
    this.started = false;
    this.onUpdateCallback = (/** @type {any} */ _msg) => {};
    this.ubxProtocolParser = new UBXProtocolParser();
    this.ubxPacketParser = new UBXPacketParser();
    this.ubxProtocolParser.pipe(this.ubxPacketParser);
    this.tryingToOpenInterval = null;
  }

  error(err) {
    console.log(err);
    
    if (err) {
      this.onUpdateCallback(false);
      if(!this.tryingToOpenInterval) {
        this.tryingToOpenInterval = setInterval(() => {
          this.open();
        }, 1000);
      }
    }
  }

  open() {
    if (this.tryingToOpenInterval) {
      clearInterval(this.tryingToOpenInterval);
      this.tryingToOpenInterval = null;  
    }
    this.port.open((err) => {
      let error = !!err;
      if (!error) {
        this.started = true;
      } else {
        this.error(err);
      } 
    });  
  }

  /**
   * @param {{ type: any; data: { flags: { gpsFixOk: any; }; gSpeed: number; totalDistance: number; distance: number; }; }} data
   */
  parseMessage(data) {
    switch (data.type) {
      case 'NAV-STATUS':
        return [{ id: WARNING_KEYS.GPS_ACQUIRED, data: !data.data.flags.gpsFixOk}]
  
      case 'NAV-VELNED':
        return [{ id: DATA_KEYS.GPS_SPEEED, data: (Math.min(255, Math.floor(data.data.gSpeed*0.022369)), 0)}] // cm/s to mph;\
        //  {id: DATA_KEYS.HEADING, data:  data.data.heading}]
 
      case 'NAV-ODO':
        return [{ id: DATA_KEYS.ODOMETER, data: Math.floor(data.data.totalDistance*0.000621371)},
         { id: DATA_KEYS.TRIP_ODOMETER, data: Math.floor(data.data.distance*0.000621371)}]
  
      default:
        return [];
    }
  }


  /**
   * Starts listening to the canbus - collect data into a dictionary;
   * @param {{ (msg: any): void; (_msg: any): void; }} onUpdateCallback
   */
  start(onUpdateCallback) {
    this.started = true;
    this.onUpdateCallback = onUpdateCallback;
    this.port = new SerialPort(this.portName, { baudRate: this.baudrate,  autoOpen: false })
    this.ubxPacketParser.on('data', (data) => { 
      this.onUpdateCallback(this.parseMessage(data));
    });
    this.port.on('error', (err) => this.error(err));
    this.port.on('close', (err) => this.error(err));
    this.port.on('disconnect', (err) => this.error(err));
    this.port.pipe(this.ubxProtocolParser);
    this.open();
  }
  
  stop() {
    if (this.port && this.port.isOpen) {
      this.port.close();
      this.port = null;
    }
    this.started = false;
  }
}

export default GPSManager;