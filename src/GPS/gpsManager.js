import SerialPort from 'serialport';
import UBXProtocolParser from './ubx/UbxProtocolParser.js';
import UBXPacketParser from './ubx/UbxPacketParser.js';
import { DATA_KEYS, WARNING_KEYS } from '../dataKeys.js';

class GPSManager {
  constructor(settings) {
    /** @type {SerialPort} */
    this.port = null;
    this.baudrate = settings.baudrate || 9600;
    this.vendorId = settings.vendor_id;
    this.started = false;
    this.onUpdateCallback = (/** @type {any} */ _msg) => {};
    this.ubxProtocolParser = new UBXProtocolParser();
    this.ubxPacketParser = new UBXPacketParser();
    this.ubxProtocolParser.pipe(this.ubxPacketParser);
    this.tryingToOpenInterval = null;
  }

  /**
   * Example result from LIST
    locationId:undefined
    manufacturer:'u-blox AG - www.u-blox.com'
    path:'/dev/ttyACM0'
    pnpId:'usb-u-blox_AG_-_www.u-blox.com_u-blox_GNSS_receiver-if00'
    productId:'01a9'
    serialNumber:undefined
    vendorId:'1546'
  */
  async connectToDevice() {
    const serialList = await SerialPort.list();
    const {path} = serialList.find(port => port.vendorId === this.vendorId);
    return new SerialPort(path, { baudRate: this.baudrate,  autoOpen: false })
  }

  error(err) {
    console.log(err);
    
    if (err) {
      this.onUpdateCallback(false);

      // if connected before, attempt to reconnect ... FOREVER
      if(this.port && !this.tryingToOpenInterval) {
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
        return [{ id: WARNING_KEYS.GPS_NOT_ACQUIRED, data: !data.data.flags.gpsFixOk}]
  
      case 'NAV-VELNED':
        return [{ id: DATA_KEYS.GPS_SPEEED, data: 25 }]
        // return [{ id: DATA_KEYS.GPS_SPEEED, data: (Math.min(255, Math.floor(data.data.gSpeed*0.022369)), 0)}] // cm/s to mph;\
        //  {id: DATA_KEYS.HEADING, data:  data.data.heading}]
 
      case 'NAV-ODO':
        return [{ id: DATA_KEYS.ODOMETER, data: Math.floor(data.data.totalDistance*0.000621371)},
         { id: DATA_KEYS.TRIP_ODOMETER, data: Math.floor(data.data.distance*0.000621371)}]
  
      case 'HNR-PVT':
          return [
            { id: WARNING_KEYS.GPS_NOT_ACQUIRED, data: !data.data.flags.gpsFixOk },
            { id: DATA_KEYS.GPS_SPEEED, data: 25 },
            //{ id: DATA_KEYS.GPS_SPEEED, data: (Math.min(255, Math.floor(data.data.gSpeed*0.00223693629)), 0)}] // mm/s to mph;
          ] 
      default:
        return [];
    }
  }


  /**
   * Starts listening to the canbus - collect data into a dictionary;
   * If you hotswap/change ports in the middle, you'll have to restart the entire app
   * @param {{ (msg: any): void; (_msg: any): void; }} onUpdateCallback
   */
   async start(onUpdateCallback) {
    try {
      this.started = true;
      this.onUpdateCallback = onUpdateCallback;
      this.ubxPacketParser.on('data', (data) => { 
        this.onUpdateCallback(this.parseMessage(data));
      });
      this.port = await this.connectToDevice();
      this.port.on('error', (err) => this.error(err));
      this.port.on('close', (err) => this.error(err));
      this.port.on('disconnect', (err) => this.error(err));
      this.port.pipe(this.ubxProtocolParser);
      this.open();
    } catch (err) {
      this.error(err);
    }
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