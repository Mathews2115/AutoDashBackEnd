// @ ayavilevich / ubx-protocol-parser 
function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }
import Debug from 'debug'
import stream from 'stream';

/*
Most fixed length payloads are below 100bytes.
Define here any packets with known and fixed payload length so we can use this for verification.
Otherwise, a corrupt input stream can feed an invalid and large payload size and will cause data loss the size of the invalid length.
A two number array means a valid packet length of i0 + i1 * N for any N.
A value of 'false' means that the packet has a variable length payload.
*/
const packetClassIdToLength = {
  '5_1': 2,
  // 'ACK-ACK',
  '5_0': 2,
  // 'ACK-NAK',

  /* '11_48': 'AID-ALM',
  '11_51': 'AID-AOP',
  '11_49': 'AID-EPH',
  '11_2': 'AID-HUI',
  '11_1': 'AID-INI',
  '6_19': 'CFG-ANT',
  '6_147': 'CFG-BATCH',
  '6_9': 'CFG-CFG',
  '6_6': 'CFG-DAT',
  '6_112': 'CFG-DGNSS',
  '6_97': 'CFG-DOSC',
  '6_133': 'CFG-DYNSEED',
  '6_96': 'CFG-ESRC',
  '6_132': 'CFG-FIXSEED',
  '6_105': 'CFG-GEOFENCE',
  '6_62': 'CFG-GNSS',
  '6_92': 'CFG-HNR',
  '6_2': 'CFG-INF',
  '6_57': 'CFG-ITFM',
  '6_71': 'CFG-LOGFILTER',
  '6_1': 'CFG-MSG',
  '6_36': 'CFG-NAV5',
  '6_35': 'CFG-NAVX5',
  '6_23': 'CFG-NMEA',
  '6_30': 'CFG-ODO',
  '6_59': 'CFG-PM2',
  '6_134': 'CFG-PMS',
  '6_0': 'CFG-PRT',
  '6_87': 'CFG-PWR',
  '6_8': 'CFG-RATE',
  '6_52': 'CFG-RINV',
  '6_4': 'CFG-RST',
  '6_17': 'CFG-RXM',
  '6_22': 'CFG-SBAS',
  '6_98': 'CFG-SMGR',
  '6_61': 'CFG-TMODE2',
  '6_113': 'CFG-TMODE3',
  '6_49': 'CFG-TP5',
  '6_83': 'CFG-TXSLOT',
  '6_27': 'CFG-USB',
  '16_21': 'ESF-INS',
  '16_2': 'ESF-MEAS',
  '16_3': 'ESF-RAW',
  '16_16': 'ESF-STATUS',
  '40_0': 'HNR-PVT',
  '4_4': 'INF-DEBUG',
  '4_0': 'INF-ERROR',
  '4_2': 'INF-NOTICE',
  '4_3': 'INF-TEST',
  '4_1': 'INF-WARNING',
  '33_17': 'LOG-BATCH',
  '33_7': 'LOG-CREATE',
  '33_3': 'LOG-ERASE',
  '33_14': 'LOG-FINDTIME',
  '33_8': 'LOG-INFO',
  '33_16': 'LOG-RETRIEVEBATCH',
  '33_15': 'LOG-RETRIEVEPOSE...',
  '33_11': 'LOG-RETRIEVEPOS',
  '33_13': 'LOG-RETRIEVESTRING',
  '33_9': 'LOG-RETRIEVE',
  '33_4': 'LOG-STRING',
  '19_96': 'MGA-ACK-DATA0',
  '19_32': 'MGA-ANO',
  '19_3': 'MGA-BDS-IONO',
  '19_128': 'MGA-DBD',
  '19_33': 'MGA-FLASH-ACK',
  '19_2': 'MGA-GAL-UTC',
  '19_6': 'MGA-GLO-TIMEOFFSET',
  '19_0': 'MGA-GPS-IONO',
  '19_64': 'MGA-INI-EOP',
  '19_5': 'MGA-QZSS-HEALTH', */
  // '10_50': 'MON-BATCH',
  '10_40': 8,
  // 'MON-GNSS',
  '10_11': 28,
  // 'MON-HW2',
  '10_9': 60,
  // 'MON-HW',
  '10_2': false,
  // 'MON-IO',
  '10_6': 120,
  // 'MON-MSGPP',
  '10_39': false,
  // 'MON-PATCH',
  '10_7': 24,
  // 'MON-RXBUF',
  '10_33': 1,
  // 'MON-RXR',
  // '10_46': 'MON-SMGR',
  '10_8': 28,
  // 'MON-TXBUF',
  '10_4': false,
  // 'MON-VER',
  // '1_96': 'NAV-AOPSTATUS',
  // '1_5': 'NAV-ATT',
  '1_34': 20,
  // 'NAV-CLOCK',
  // '1_49': 'NAV-DGPS',
  '1_4': 18,
  // 'NAV-DOP',
  '1_97': 4,
  // 'NAV-EOE',
  '1_57': false,
  // 'NAV-GEOFENCE',
  '1_19': 28,
  // 'NAV-HPPOSECEF',
  '1_20': 36,
  // 'NAV-HPPOSLLH',
  '1_9': 20,
  // 'NAV-ODO',
  '1_52': false,
  // 'NAV-ORB',
  '1_1': 20,
  // 'NAV-POSECEF',
  '1_2': 28,
  // 'NAV-POSLLH',
  '1_7': 92,
  // 'NAV-PVT',
  '1_60': 64,
  // 'NAV-RELPOSNED',
  '1_16': 0,
  // 'NAV-RESETODO',
  '1_53': [8, 12],
  // 'NAV-SAT',
  '1_67': [8, 16],
  // 'NAV-SIG',
  // '1_50': 'NAV-SBAS',
  // '1_6': 'NAV-SOL',
  '1_3': 16,
  // 'NAV-STATUS',
  // '1_48': 'NAV-SVINFO',
  '1_59': 40,
  // 'NAV-SVIN',
  '1_36': 20,
  // 'NAV-TIMEBDS',
  '1_37': 20,
  // 'NAV-TIMEGAL',
  '1_35': 20,
  // 'NAV-TIMEGLO',
  '1_32': 16,
  // 'NAV-TIMEGPS',
  '1_38': 24,
  // 'NAV-TIMELS',
  '1_33': 20,
  // 'NAV-TIMEUTC',
  '1_17': 20,
  // 'NAV-VELECEF',
  '1_18': 36,
  // 'NAV-VELNED',

  /* '2_97': 'RXM-IMES',
  '2_20': 'RXM-MEASX',
  '2_65': 'RXM-PMREQ',
  '2_21': 'RXM-RAWX',
  '2_89': 'RXM-RLM', */
  '2_50': 8 // 'RXM-RTCM',

  /* '2_19': 'RXM-SFRBX',
  '2_32': 'RXM-SVSI',
  '39_1': 'SEC-SIGN',
  '39_3': 'SEC-UNIQID',
  '13_17': 'TIM-DOSC',
  '13_22': 'TIM-FCHG',
  '13_23': 'TIM-HOC',
  '13_19': 'TIM-SMEAS',
  '13_4': 'TIM-SVIN',
  '13_3': 'TIM-TM2',
  '13_18': 'TIM-TOS',
  '13_1': 'TIM-TP',
  '13_21': 'TIM-VCOCAL',
  '13_6': 'TIM-VRFY',
  '9_20': 'UPD-SOS', */

};

/* eslint-disable no-mixed-operators */
const debug = Debug('ubx:protocol:parser');
const PACKET_SYNC_1 = 0;
const PACKET_SYNC_2 = 1;
const PACKET_CLASS = 2;
const PACKET_ID = 3;
const PACKET_LENGTH = 4;
const PACKET_LENGTH_2 = 5;
const PACKET_PAYLOAD = 6;
const PACKET_CHECKSUM = 7;
/*
Limit max payload size to prevent a corrupt length from messing with data.
In case of an invalid length, this state machine will not "go back" and data will be lost. In any case, a delay is not desired.
Mind that some messages have variable length so set the max correctly depending on the messages you have enabled.
You can override the default using options.maxPacketPayloadLength
*/

const DEFAULT_MAX_PACKET_PAYLOAD_LENGTH = 300; // cap max packet size, proper max will depend on the type of messages the ubx is sending

const packetTemplate = {
  class: 0,
  id: 0,
  length: 0,
  payload: null,
  checksum: 0,
  length1: null,
  length2: null,
  checksum1: null,
  checksum2: null,
};

function calcCheckSum(messageClass, id, length, payload) {
  let buffer = Buffer.alloc(4);
  buffer.writeUInt8(messageClass, 0);
  buffer.writeUInt8(id, 1);
  buffer.writeUInt16LE(length, 2);
  buffer = Buffer.concat([buffer, payload]);
  let a = 0;
  let b = 0;

  for (let i = 0; i < buffer.length; i += 1) {
    [a] = new Uint8Array([a + buffer[i]]);
    [b] = new Uint8Array([b + a]);
  }

  return b << 8 | a;
}

class UBXProtocolParser extends stream.Transform {
  constructor(options) {
    super({ ...options,
      objectMode: true
    });
    this.packet = { ...packetTemplate
    };
    this.payloadPosition = 0;
    this.packetStartFound = false;
    this.packetState = PACKET_SYNC_1;
    this.streamIndex = 0; // max payload size to allow. pass 0 to disable this check.

    this.maxPacketPayloadLength = typeof options === 'object' && typeof options.maxPacketPayloadLength === 'number' ? options.maxPacketPayloadLength : DEFAULT_MAX_PACKET_PAYLOAD_LENGTH;
  } // eslint-disable-next-line no-underscore-dangle


  _transform(chunk, encoding, cb) {
    // init working buffer and pointer
    let data = chunk;
    let i = 0; // loop on data, note we can back track

    while (i < data.length) {
      const byte = data[i]; // debug(`Incoming byte "${byte}", 0x${byte.toString(16)} received at state "${this.packetState},${this.packetStartFound}"`);
      // debug(`payload.len: ${this.packet.length}, payloadPosition: ${this.payloadPosition}, streamIndex: ${this.streamIndex}`);

      if (this.packetStartFound) {
        switch (this.packetState) {
          case PACKET_SYNC_1:
            if (byte === 0x62) {
              this.packetState = PACKET_SYNC_2;
            } else if (byte === 0xB5) {
              
            } else {
              debug(`Unknown byte "${byte}", 0x${byte.toString(16)} received at state "${this.packetState},${this.packetStartFound}"`);
              this.resetState();
            }

            break;

          case PACKET_SYNC_2:
            this.packet.class = byte;
            this.packetState = PACKET_CLASS;
            break;

          case PACKET_CLASS:
            this.packet.id = byte;
            this.packetState = PACKET_ID;
            break;

          case PACKET_ID:
            this.packet.length1 = byte;
            this.packetState = PACKET_LENGTH;
            break;

          case PACKET_LENGTH:
            {
              // got one length byte, next one to follow
              this.packet.length2 = byte;
              this.packet.length = this.packet.length1 + this.packet.length2 * 2 ** 8; // verify length for class/id

              const packetType = `${this.packet.class}_${this.packet.id}`;

              if (this.maxPacketPayloadLength && this.packet.length > this.maxPacketPayloadLength) {
                debug(`Payload length ${this.packet.length} larger than allowed max length ${this.maxPacketPayloadLength}`);
                this.emit('payload_too_large', {
                  packet: this.packet,
                  maxPacketPayloadLength: this.maxPacketPayloadLength
                });
                this.resetState();
              } else if (this.packet.length === 0) {
                // poll packet
                this.packetState = PACKET_PAYLOAD; // packet with no payload, go straight to checksum state

                this.packet.payload = Buffer.alloc(0);
              } else if (typeof packetClassIdToLength[packetType] === 'number' && this.packet.length !== packetClassIdToLength[packetType]) {
                debug(`Payload length ${this.packet.length} wrong for packet class/id ${packetClassIdToLength[packetType]}, ${packetType}`);
                this.emit('wrong_payload_length', {
                  packet: this.packet,
                  expectedPayloadLength: packetClassIdToLength[packetType]
                });
                this.resetState();
              } else if (Array.isArray(packetClassIdToLength[packetType]) && (this.packet.length - packetClassIdToLength[packetType][0]) % packetClassIdToLength[packetType][1] !== 0) {
                debug(`Payload length ${this.packet.length} wrong for packet class/id ${packetClassIdToLength[packetType]}, ${packetType}`);
                this.emit('wrong_payload_length', {
                  packet: this.packet,
                  expectedPayloadLength: packetClassIdToLength[packetType]
                });
                this.resetState();
              } else {
                // normal case
                this.packetState = PACKET_LENGTH_2;
              }

              break;
            }

          case PACKET_LENGTH_2:
            if (this.packet.payload === null) {
              this.packet.payload = Buffer.alloc(this.packet.length);
              this.payloadPosition = 0;
            }

            this.packet.payload[this.payloadPosition] = byte;
            this.payloadPosition += 1;

            if (this.payloadPosition >= this.packet.length) {
              this.packetState = PACKET_PAYLOAD; // go to next state
            }

            break;

          case PACKET_PAYLOAD:
            // done with payload
            this.packet.checksum1 = byte;
            this.packetState = PACKET_CHECKSUM;
            break;

          case PACKET_CHECKSUM:
            {
              this.packet.checksum2 = byte;
              this.packet.checksum = this.packet.checksum1 + this.packet.checksum2 * 2 ** 8;
              const checksum = calcCheckSum(this.packet.class, this.packet.id, this.packet.length, this.packet.payload);

              if (checksum === this.packet.checksum) {
                if (this.packet.length > 0) {
                  // if not polling but actual data
                  this.push({
                    messageClass: this.packet.class,
                    messageId: this.packet.id,
                    payload: this.packet.payload
                  });
                } else {
                  this.emit('polling_message', {
                    packet: this.packet
                  });
                }
              } else {
                debug(`Checksum "${checksum}" doesn't match received CheckSum "${this.packet.checksum}"`); // emit an event about the failed checksum

                this.emit('failed_checksum', {
                  packet: this.packet,
                  checksum
                }); // back track on data to after last sync point (which was not good)
                // if we don't back track and just continue here then we will loose ~payload.length of data which might have new packets

                const headerBuffer = Buffer.alloc(4); // reconstruct, this doesn't have to be part of the current "chunk", could have been processed in previous calls

                headerBuffer.writeUInt8(this.packet.class, 0);
                headerBuffer.writeUInt8(this.packet.id, 1);
                headerBuffer.writeUInt16LE(this.packet.payload.length, 2);
                data = Buffer.concat([headerBuffer, this.packet.payload, new Uint8Array([this.packet.checksum1, this.packet.checksum2]), data.slice(i + 1)]);
                i = -1; // will be advanced to 0 (next read pos) on loop end

                this.streamIndex -= headerBuffer.length + this.packet.payload.length + 2;
              }

              this.resetState();
              break;
            }

          default:
            debug(`Should never reach this packetState "${this.packetState}`);
        }
      } else if (byte === 0xB5) {
        this.packetStartFound = true;
        this.packetState = PACKET_SYNC_1;
      } else {
        debug(`Unknown byte "${byte}", 0x${byte.toString(16)} received at state "${this.packetState},${this.packetStartFound}"`);
      } // advance to next byte


      this.streamIndex += 1;
      i += 1;
    }

    cb();
  }

  resetState() {
    this.packetState = PACKET_SYNC_1;
    this.packet = { ...packetTemplate
    };
    this.payloadPosition = 0;
    this.packetStartFound = false;
  } // eslint-disable-next-line no-underscore-dangle


  _flush(cb) {
    this.resetState();
    cb();
  }

}

export default UBXProtocolParser;
//# sourceMappingURL=index.js.map
