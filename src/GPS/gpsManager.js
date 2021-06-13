import SerialPort from 'serialport';
import UBXProtocolParser from './ubx/UbxProtocolParser.js';
import UBXPacketParser from './ubx/UbxPacketParser.js';

class GPSManager {
  constructor(settings) {

    this.port = null;
    this.baudrate = settings.baudRate || 9600;
    this.port = settings.port || '';
    this.odometerOffset = settings.currentOdometer || 0; // last saved odometer
    this.started = false;
    this.speed = 0;  //cm/s
    this.odometer = 0; //m
    this.tripOdometer = 0; //m
    this.error = false;
    this.signalAcquired = false;

    this.buffer = Buffer.allocUnsafe(1 + 1 + 2) // speed (1 byte), signal aqcuired , odometer(2 bytes)
  }


  // Packet Data:
  // Byte 0 - 0-255 speed in kph
  // Byte 1 - Bit 0: signal acquired | Bit 1: Serial Error
  // Byte 2 - 2 Bytes - odometer
  getLatestPacket() {
    this.buffer.writeUInt8(Math.min(255, Math.floor(this.speed*0.022369)), 0); // cm/s to mph
    // write flag packet:
    let bitFlags = 0;
    bitFlags |= this.signalAcquired ? 1 : 0; //0001
    bitFlags |= this.error ? 2 : 0;          //0010
    this.buffer.writeUInt8(bitFlags, 1);
    this.buffer.writeUInt16BE(Math.min(65535, Math.floor(this.odometer*0.000621371) + this.odometerOffset), 2);
    return this.buffer;
  }

  onUpdate(data) {
    switch (data.type) {
      case 'NAV-STATUS':
        this.signalAcquired = data.data.flags.gpsFixOk;
        break;
  
      case 'NAV-VELNED':
        this.speed = data.data.gSpeed;
        this.heading = data.data.heading;
        break;
  
      case 'NAV-ODO':
        this.odometer = data.data.totalDistance;
        this.tripOdometer = data.data.distance;
        break;
  
      default:
        break;
    }
  }

  start() {
    try {
      this.port = new SerialPort(this.port, { baudRate: this.baudrate,  autoOpen: false })

      const ubxProtocolParser = new UBXProtocolParser();
      const ubxPacketParser = new UBXPacketParser();
      ubxProtocolParser.pipe(ubxPacketParser);
      ubxPacketParser.on('data', (data) => { this.onUpdate(data) });

      this.port.on('error', (e) => {
        console.log(e);
        this.reset();
        this.error = true;
      });
      this.port.on('close', (d) => {
        console.log(d)
        this.reset();
      });

      this.port.open((err) => {
        this.error = !!err;
        if (!this.error) {
          this.started = true;
        } else {
          console.error("ERROR: GPS could not initialize: ", err);
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

  reset() {
    this.speed = 0;
    this.signalAcquired = false;
  }
}

export default GPSManager;