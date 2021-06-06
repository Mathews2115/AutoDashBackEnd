import serialport from 'serialport';
import nmea from 'nmea';

class GPSManager {
  constructor(settings) {
    this.baudrate = settings.baudRate || 9600;
    this.odometerOffset = settings.currentOdometer || 0; // last saved odometer
    this.started = false;
    this.speed = 0; 
    this.odometer = 0;
    this.signalAcquired = false;

    this.buffer = Buffer.allocUnsafe(1 + 2) // speed (1 byte), odometer(2 bytes)
  }

  getLatestPacket() {
    this.buffer.writeUInt8(Math.min(255, this.speed), 0);
    this.buffer.writeUInt16BE(Math.min(65535, this.odometer + this.odometerOffset), 1);
    return this.buffer
  }

  start() {
   

    try {
      var port = new serialport.SerialPort('/dev/cu.usbserial', {
        baudrate: this.baudrate,
        parser: serialport.parsers.readline('\r\n')});

      port.on('data', (line) => {
        // console.log(nmea.parse(line));
        //this.speed = Math.ceil(parseFloat(speedString))
        //this.odometer = Math.ceil(parseFloat(speedString))
      });

      this.started = true;
    } catch (error) {
      console.error("ERROR: GPS could not initialize: ", error);
      throw error;
    }
 
    return this.started;
  }
  
  stop() {
    this.started = false;
  }
}

export default GPSManager;