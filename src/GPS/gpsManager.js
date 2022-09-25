import { SerialPort } from 'serialport';
import UBXProtocolParser from './ubx/UbxProtocolParser.js';
import UBXPacketParser from './ubx/UbxPacketParser.js';
import { DATA_MAP, WARNING_KEYS } from '../dataKeys.js';

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
   * Connect to physical device via serial port
   * 
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
    const { path } = serialList.find((port) => port.vendorId === this.vendorId);
    return new SerialPort({ path, baudRate: this.baudrate, autoOpen: false });
  }

  error(err) {
    console.log("GPSManager:", err);

    if (err) {
      this.onUpdateCallback(false);

      // if connected before, attempt to reconnect ... FOREVER
      if (this.started && this.port && !this.tryingToOpenTimeout) {
        this.tryingToOpenTimeout = setTimeout(() => {
          this.open();
        }, 1000);
      }
    }
  }

  open() {
    if (this.tryingToOpenTimeout) {
      clearTimeout(this.tryingToOpenTimeout);
      this.tryingToOpenTimeout = null;
    }
    this.port.open((err) => {
      const error = !!err;
      if (error) {
        this.error(err);
      }
    });
  }

  /**
   * @param {{ type: any; data: { flags: { gpsFixOk: any; }; gSpeed: number; gpsFixRaw: { value: number; }; totalDistance: number; distance: number; }; }} data
   */
  parseMessage(data) {
    switch (data.type) {
      case 'NAV-ODO':
        return [
          // so the GPS hardware wont retain these and will cold restart due to losing power - so we will persist the values and use the trip odo instead
          // { id: DATA_KEYS.ODOMETER, data: Math.floor(data.data.totalDistance * 0.000621371) }, 
          { id: DATA_MAP.ODOMETER, data: Math.floor(data.data.distance * 0.000621371) },
        ];

      case 'HNR-PVT':
        return [
          {
            id: WARNING_KEYS.GPS_NOT_ACQUIRED,
            data:  data.data.gpsFixRaw.value <= 1 || data.data.gpsFixRaw.value >= 5,
          },
          {
            id: DATA_MAP.GPS_SPEEED,
            data: Math.min(255, Math.floor(data.data.gSpeed * 0.00223693629)), // mm/s to mph;
          }, 
        ];
      default:
        return [];
    }
  }

  resetOdometer() {     
    //https://content.u-blox.com/sites/default/files/products/documents/u-blox8-M8_ReceiverDescrProtSpec_UBX-13003221.pdf
    const resetOdometerBuffer = new Uint8Array([0x01, 0x10, 0x0, 0x0])
    let chksumA = 0, chksumB = 0;
    for (let i = 0; i < resetOdometerBuffer.length; i++) {
      chksumA += resetOdometerBuffer[i];
      chksumB += chksumA;
    }
    const resetOdometerByteArray = new Uint8Array([0xB5, 0x62, 
      ...resetOdometerBuffer, chksumA, chksumB,
    ])
    this.port.write(resetOdometerByteArray);
    this.ubxProtocolParser.write(resetOdometerByteArray);
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

      // UBX-NAV-RESETODO (0x01 0x10) - reset odo 
      // https://content.u-blox.com/sites/default/files/u-blox-M9-SPG-4.04_InterfaceDescription_UBX-21022436.pdf
      this.resetOdometer();
    } catch (err) {
      this.error(err);
    }
  }

  stop() {
    this.started = false; // turn this off, so no reconnect attempts occur
    if (this.port && this.port.isOpen) {
      this.port.close();
    }
    this.port = null;
  }
}

export default GPSManager;
