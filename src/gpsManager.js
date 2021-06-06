import SerialPort from 'serialport';
const Readline = SerialPort.parsers.Readline
import nmea from 'nmea';

class GPSManager {
  constructor(settings) {
    this.port = null;
    this.baudrate = settings.baudRate || 9600;
    this.port = settings.port || '';
    this.odometerOffset = settings.currentOdometer || 0; // last saved odometer
    this.started = false;
    this.speed = 0; 
    this.odometer = 0;
    this.error = false;
    this.signalAcquired = false;

    this.buffer = Buffer.allocUnsafe(1 + 1 + 2) // speed (1 byte), signal aqcuired , odometer(2 bytes)
  }


  // Packet Data:
  // Byte 0 - 0-255 speed in kph
  // Byte 1 - Bit 0: signal acquired | Bit 1: Serial Error
  // Byte 2 - 2 Bytes - odometer
  getLatestPacket() {
    this.buffer.writeUInt8(Math.min(255, this.speed), 0);
    // write flag packet:
    let bitFlags = 0;
    bitFlags |= this.signalAcquired ? 0x01 : 0;
    bitFlags |= this.error ? 0x02 : 0;
    this.buffer.writeUInt8(bitFlags, 1);
    this.buffer.writeUInt16BE(Math.min(65535, this.odometer + this.odometerOffset), 2);
    return this.buffer
  }

  start() {
    try {
      this.port = new SerialPort(this.port, { baudRate: this.baudrate })
      let parser = this.port.pipe(new Readline({ delimiter: '\r\n' }))
      parser.on('data', (line) => {
        try {
          const data = nmea.parse(line)
          console.log(nmea.parse(line));
          console.log(line.toString());
          if (data.sentence == 'VTG' && data.type == 'track-info') {
            this.speed = Math.ceil(parseFloat( data.speedKmph));
          }
          //this.odometer = Math.ceil(parseFloat(...))
          //this.signalAcquired = ???
        } catch (e) {
          console.log(e);
        }
      });

      this.port.on('open', () => {
        this.error = false;
      });
      this.port.on('error', (e) => {
        console.log(e);
        this.reset();
        this.error = true;
      });
      this.port.on('close', (d) => {
        console.log(d)
        this.reset();
      });

      this.started = true;
    } catch (error) {
      console.error("ERROR: GPS could not initialize: ", error);
      throw error;
    }
 
    return this.started;
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