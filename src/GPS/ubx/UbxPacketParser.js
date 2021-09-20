'use strict';
//https://github.com/ayavilevich/ubx-packet-parser
import Debug from 'debug'
import stream from 'stream';
import { decodeGPSFix } from './ubxHelper.js';


const gnssIdentifiersInversed = {
  0: 'GPS',
  1: 'SBAS',
  2: 'Galileo',
  3: 'BeiDou',
  4: 'IMES',
  5: 'QZSS',
  6: 'GLONASS'
};
const gnssSignalIdentifiersInversed = {
  0: {
    0: 'L1C/A',
    3: 'L2 CL',
    4: 'L2 CM'
  },
  2: {
    0: 'E1 C',
    1: 'E1 B',
    5: 'E5 bl',
    6: 'E5 bQ'
  },
  3: {
    0: 'B1l D1',
    1: 'B1l D2',
    2: 'B2l D1',
    3: 'B2l D2'
  },
  5: {
    0: 'L1C/A',
    4: 'L2 CM',
    5: 'L2 CL'
  },
  6: {
    0: 'L1 OF',
    2: 'L2 OF'
  }
};
const packetTypes = {
  'ACK-ACK': '5_1',
  'ACK-NAK': '5_0',
  'AID-ALM': '11_48',
  'AID-AOP': '11_51',
  'AID-EPH': '11_49',
  'AID-HUI': '11_2',
  'AID-INI': '11_1',
  'CFG-ANT': '6_19',
  'CFG-BATCH': '6_147',
  'CFG-CFG': '6_9',
  'CFG-DAT': '6_6',
  'CFG-DGNSS': '6_112',
  'CFG-DOSC': '6_97',
  'CFG-DYNSEED': '6_133',
  'CFG-ESRC': '6_96',
  'CFG-FIXSEED': '6_132',
  'CFG-GEOFENCE': '6_105',
  'CFG-GNSS': '6_62',
  'CFG-HNR': '6_92',
  'CFG-INF': '6_2',
  'CFG-ITFM': '6_57',
  'CFG-LOGFILTER': '6_71',
  'CFG-MSG': '6_1',
  'CFG-NAV5': '6_36',
  'CFG-NAVX5': '6_35',
  'CFG-NMEA': '6_23',
  'CFG-ODO': '6_30',
  'CFG-PM2': '6_59',
  'CFG-PMS': '6_134',
  'CFG-PRT': '6_0',
  'CFG-PWR': '6_87',
  'CFG-RATE': '6_8',
  'CFG-RINV': '6_52',
  'CFG-RST': '6_4',
  'CFG-RXM': '6_17',
  'CFG-SBAS': '6_22',
  'CFG-SMGR': '6_98',
  'CFG-TMODE2': '6_61',
  'CFG-TMODE3': '6_113',
  'CFG-TP5': '6_49',
  'CFG-TXSLOT': '6_83',
  'CFG-USB': '6_27',
  'ESF-INS': '16_21',
  'ESF-MEAS': '16_2',
  'ESF-RAW': '16_3',
  'ESF-STATUS': '16_16',
  'HNR-PVT': '40_0',
  'INF-DEBUG': '4_4',
  'INF-ERROR': '4_0',
  'INF-NOTICE': '4_2',
  'INF-TEST': '4_3',
  'INF-WARNING': '4_1',
  'LOG-BATCH': '33_17',
  'LOG-CREATE': '33_7',
  'LOG-ERASE': '33_3',
  'LOG-FINDTIME': '33_14',
  'LOG-INFO': '33_8',
  'LOG-RETRIEVEBATCH': '33_16',
  'LOG-RETRIEVEPOSE...': '33_15',
  'LOG-RETRIEVEPOS': '33_11',
  'LOG-RETRIEVESTRING': '33_13',
  'LOG-RETRIEVE': '33_9',
  'LOG-STRING': '33_4',
  'MGA-ACK-DATA0': '19_96',
  'MGA-ANO': '19_32',
  'MGA-BDS-EPH': '19_3',
  'MGA-BDS-ALM': '19_3',
  'MGA-BDS-HEALTH': '19_3',
  'MGA-BDS-UTC': '19_3',
  'MGA-BDS-IONO': '19_3',
  'MGA-DBD': '19_128',
  'MGA-FLASH-DATA': '19_33',
  'MGA-FLASH-STOP': '19_33',
  'MGA-FLASH-ACK': '19_33',
  'MGA-GAL-EPH': '19_2',
  'MGA-GAL-ALM': '19_2',
  'MGA-GAL-TIMEOFFSET': '19_2',
  'MGA-GAL-UTC': '19_2',
  'MGA-GLO-EPH': '19_6',
  'MGA-GLO-ALM': '19_6',
  'MGA-GLO-TIMEOFFSET': '19_6',
  'MGA-GPS-EPH': '19_0',
  'MGA-GPS-ALM': '19_0',
  'MGA-GPS-HEALTH': '19_0',
  'MGA-GPS-UTC': '19_0',
  'MGA-GPS-IONO': '19_0',
  'MGA-INI-POS_XYZ': '19_64',
  'MGA-INI-POS_LLH': '19_64',
  'MGA-INI-TIME_UTC': '19_64',
  'MGA-INI-TIME_GNSS': '19_64',
  'MGA-INI-CLKD': '19_64',
  'MGA-INI-FREQ': '19_64',
  'MGA-INI-EOP': '19_64',
  'MGA-QZSS-EPH': '19_5',
  'MGA-QZSS-ALM': '19_5',
  'MGA-QZSS-HEALTH': '19_5',
  'MON-BATCH': '10_50',
  'MON-GNSS': '10_40',
  'MON-HW2': '10_11',
  'MON-HW': '10_9',
  'MON-IO': '10_2',
  'MON-MSGPP': '10_6',
  'MON-PATCH': '10_39',
  'MON-RXBUF': '10_7',
  'MON-RXR': '10_33',
  'MON-SMGR': '10_46',
  'MON-TXBUF': '10_8',
  'MON-VER': '10_4',
  'MON-RF': '10_56',
  'NAV-AOPSTATUS': '1_96',
  'NAV-ATT': '1_5',
  'NAV-CLOCK': '1_34',
  'NAV-DGPS': '1_49',
  'NAV-DOP': '1_4',
  'NAV-EOE': '1_97',
  'NAV-GEOFENCE': '1_57',
  'NAV-HPPOSECEF': '1_19',
  'NAV-HPPOSLLH': '1_20',
  'NAV-ODO': '1_9',
  'NAV-ORB': '1_52',
  'NAV-POSECEF': '1_1',
  'NAV-POSLLH': '1_2',
  'NAV-PVT': '1_7',
  'NAV-RELPOSNED': '1_60',
  'NAV-RESETODO': '1_16',
  'NAV-SAT': '1_53',
  'NAV-SIG': '1_67',
  'NAV-SBAS': '1_50',
  'NAV-SOL': '1_6',
  'NAV-STATUS': '1_3',
  'NAV-SVINFO': '1_48',
  'NAV-SVIN': '1_59',
  'NAV-TIMEBDS': '1_36',
  'NAV-TIMEGAL': '1_37',
  'NAV-TIMEGLO': '1_35',
  'NAV-TIMEGPS': '1_32',
  'NAV-TIMELS': '1_38',
  'NAV-TIMEUTC': '1_33',
  'NAV-VELECEF': '1_17',
  'NAV-VELNED': '1_18',
  'RXM-IMES': '2_97',
  'RXM-MEASX': '2_20',
  'RXM-PMREQ': '2_65',
  'RXM-RAWX': '2_21',
  'RXM-RLM': '2_89',
  'RXM-RTCM': '2_50',
  'RXM-SFRBX': '2_19',
  'RXM-SVSI': '2_32',
  'SEC-SIGN': '39_1',
  'SEC-UNIQID': '39_3',
  'TIM-DOSC': '13_17',
  'TIM-FCHG': '13_22',
  'TIM-HOC': '13_23',
  'TIM-SMEAS': '13_19',
  'TIM-SVIN': '13_4',
  'TIM-TM2': '13_3',
  'TIM-TOS': '13_18',
  'TIM-TP': '13_1',
  'TIM-VCOCAL': '13_21',
  'TIM-VRFY': '13_6',
  'UPD-SOS': '9_20'
};
const packetTypesInversed = {
  '5_1': 'ACK-ACK',
  '5_0': 'ACK-NAK',
  '11_48': 'AID-ALM',
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
  '19_5': 'MGA-QZSS-HEALTH',
  '10_50': 'MON-BATCH',
  '10_40': 'MON-GNSS',
  '10_11': 'MON-HW2',
  '10_9': 'MON-HW',
  '10_2': 'MON-IO',
  '10_6': 'MON-MSGPP',
  '10_39': 'MON-PATCH',
  '10_7': 'MON-RXBUF',
  '10_33': 'MON-RXR',
  '10_46': 'MON-SMGR',
  '10_8': 'MON-TXBUF',
  '10_4': 'MON-VER',
  '10_56': 'MON-RF',
  '1_96': 'NAV-AOPSTATUS',
  '1_5': 'NAV-ATT',
  '1_34': 'NAV-CLOCK',
  '1_49': 'NAV-DGPS',
  '1_4': 'NAV-DOP',
  '1_97': 'NAV-EOE',
  '1_57': 'NAV-GEOFENCE',
  '1_19': 'NAV-HPPOSECEF',
  '1_20': 'NAV-HPPOSLLH',
  '1_9': 'NAV-ODO',
  '1_52': 'NAV-ORB',
  '1_1': 'NAV-POSECEF',
  '1_2': 'NAV-POSLLH',
  '1_7': 'NAV-PVT',
  '1_60': 'NAV-RELPOSNED',
  '1_16': 'NAV-RESETODO',
  '1_53': 'NAV-SAT',
  '1_67': 'NAV-SIG',
  '1_50': 'NAV-SBAS',
  '1_6': 'NAV-SOL',
  '1_3': 'NAV-STATUS',
  '1_48': 'NAV-SVINFO',
  '1_59': 'NAV-SVIN',
  '1_36': 'NAV-TIMEBDS',
  '1_37': 'NAV-TIMEGAL',
  '1_35': 'NAV-TIMEGLO',
  '1_32': 'NAV-TIMEGPS',
  '1_38': 'NAV-TIMELS',
  '1_33': 'NAV-TIMEUTC',
  '1_17': 'NAV-VELECEF',
  '1_18': 'NAV-VELNED',
  '2_97': 'RXM-IMES',
  '2_20': 'RXM-MEASX',
  '2_65': 'RXM-PMREQ',
  '2_21': 'RXM-RAWX',
  '2_89': 'RXM-RLM',
  '2_50': 'RXM-RTCM',
  '2_19': 'RXM-SFRBX',
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
  '9_20': 'UPD-SOS'
};

/* eslint-disable no-bitwise,default-case */
/**
 * @typedef {object} protocolMessage
 * @property {number} messageClass
 * @property {number} messageId
 * @property {Buffer} payload
 */

const weekSeconds = 60 * 60 * 24 * 7;

function bitToBool(byte, bit) {
  return (byte >> bit) % 2 !== 0;
}

function itowToDate(itow) {
  const gpsEpochSeconds = 315964800; // delta between unix epoch, January 1, 1970, UTC, (used by Date()) and gps baseline at January 6, 1980, UTC

  const week = Math.floor((new Date().getTime() - new Date('1980-01-06').getTime()) / 1000 / 60 / 60 / 24 / 7); //  calculate current week number since gps baseline using local time
  // TODO: this is problematic, because local time (where parsing happens) might not be in sync with true time, so at week change points local we will have discontinuity.
  // either use NAV-PVT with UTC time coming from GNSS alone or calc local Tow and week and try to match to next or prev local week based on match with receiver itow (i.e. which end it is close to).
  // additionally, if doing the calculation ourselves, there will be inaccuracies due to leap seconds. See Integration Manual section "3.7 Clocks and time".
  // best solution for relative deltas is to subtract itow while taking care of overflow.
  // best solution for UTC absolute values is to wait for receiver to properly sync with time. Use flags and fields in NAV-PVT.

  return new Date((gpsEpochSeconds + weekSeconds * week + itow / 1000) * 1000);
} // returns difference (in ms) between two itow values
// handles overflow
// can't correctly diff two values more than one week apart


function itowDiff(itowStart, itowEnd) {
  if (itowEnd < itowStart) {
    // if overflow
    return itowEnd + weekSeconds * 1000 - itowStart;
  }

  return itowEnd - itowStart; // simple case
}
/**
 * @param {protocolMessage} packet
 */


function status(packet) {
  const {gpsFixRaw, gpsFix} = decodeGPSFix();

  const flags = {
    gpsFixOk: bitToBool(packet.payload.readUInt8(5), 0),
    diffSoln: bitToBool(packet.payload.readUInt8(5), 1),
    wknSet: bitToBool(packet.payload.readUInt8(5), 2),
    towSet: bitToBool(packet.payload.readUInt8(5), 3),
    psmStateRaw: {},
    spoofDetStateRaw: {}
  }; // Power Save Mode state

  flags.psmStateRaw.bits = `${(packet.payload.readUInt8(7) >> 1) % 2}${(packet.payload.readUInt8(7) >> 0) % 2}`;

  switch (flags.psmStateRaw.bits) {
    case '00':
      flags.psmState = 'acquisition';
      flags.psmStateRaw.string = 'ACQUISITION';
      break;

    case '01':
      flags.psmState = 'tracking';
      flags.psmStateRaw.string = 'TRACKING';
      break;

    case '10':
      flags.psmState = 'power-optimized-tracking';
      flags.psmStateRaw.string = 'POWER OPTIMIZED TRACKING';
      break;

    case '11':
      flags.psmState = 'inactive';
      flags.psmStateRaw.string = 'INACTIVE';
      break;
  } // Spoofing detection state


  flags.spoofDetStateRaw.bits = `${(packet.payload.readUInt8(7) >> 4) % 2}${(packet.payload.readUInt8(7) >> 3) % 2}`;

  switch (flags.spoofDetStateRaw.bits) {
    case '00':
      flags.spoofDetState = 'unknown';
      flags.spoofDetStateRaw.string = 'Unknown or deactivated';
      break;

    case '01':
      flags.spoofDetState = 'no-spoofing';
      flags.spoofDetStateRaw.string = 'No spoofing indicated';
      break;

    case '10':
      flags.spoofDetState = 'spoofing';
      flags.spoofDetStateRaw.string = 'Spoofing indicated';
      break;

    case '11':
      flags.spoofDetState = 'multiple-spoofing';
      flags.spoofDetStateRaw.string = 'Multiple spoofing indications';
      break;
  }

  const fixStat = {
    diffCorr: bitToBool(packet.payload.readUInt8(6), 0) // mapMatching: `${(packet.payload.readUInt8(6) >> 7) % 2}${(packet.payload.readUInt8(6) >> 6) % 2}`, // add parsing of bit options if going to expose this field

  };
  return {
    type: 'NAV-STATUS',
    iTOW: packet.payload.readUInt32LE(0),
    // GPS time of week of the navigation epoch. [ms]
    timeStamp: itowToDate(packet.payload.readUInt32LE(0)),
    data: {
      iTOW: packet.payload.readUInt32LE(0),
      gpsFix,
      gpsFixRaw,
      flags,
      fixStat,
      ttff: packet.payload.readUInt32LE(8),
      // Time to first fix (millisecond time tag) [ms]
      msss: packet.payload.readUInt32LE(12) // Milliseconds since Startup / Reset [ms]

    }
  };
}
/**
 * @param {protocolMessage} packet
 */


function posllh(packet) {
  return {
    type: 'NAV-POSLLH',
    iTOW: packet.payload.readUInt32LE(0),
    timeStamp: itowToDate(packet.payload.readUInt32LE(0)),
    data: {
      iTOW: packet.payload.readUInt32LE(0),
      lon: packet.payload.readInt32LE(4) / 1e7,
      // [deg]
      lat: packet.payload.readInt32LE(8) / 1e7,
      // [deg]
      height: packet.payload.readInt32LE(12),
      // [mm]
      hMSL: packet.payload.readInt32LE(16),
      // [mm]
      hAcc: packet.payload.readUInt32LE(20),
      // [mm]
      vAcc: packet.payload.readUInt32LE(24) // [mm]

    }
  };
}
/**
 * @param {protocolMessage} packet
 */


function velned(packet) {
  return {
    type: 'NAV-VELNED',
    iTOW: packet.payload.readUInt32LE(0),
    timeStamp: itowToDate(packet.payload.readUInt32LE(0)),
    data: {
      iTOW: packet.payload.readUInt32LE(0),
      velN: packet.payload.readInt32LE(4),
      // [cm/s]
      velE: packet.payload.readInt32LE(8),
      // [cm/s]
      velD: packet.payload.readInt32LE(12),
      // [cm/s]
      speed: packet.payload.readUInt32LE(16),
      // [cm/s]
      gSpeed: packet.payload.readUInt32LE(20),
      // [cm/s]
      heading: packet.payload.readInt32LE(24) / 1e5,
      // [deg]
      sAcc: packet.payload.readUInt32LE(28),
      // [cm/s]
      cAcc: packet.payload.readInt32LE(32) / 1e5 // [deg]

    }
  };
}
/**
 * @param {protocolMessage} packet
 * 
 */


 function odo(packet) {
  return {
    type: 'NAV-ODO',
    iTOW: packet.payload.readUInt32LE(4),
    timeStamp: itowToDate(packet.payload.readUInt32LE(0)),
    data: {
      itow: packet.payload.readUInt32LE(4),
      distance: packet.payload.readUInt32LE(8),
      totalDistance: packet.payload.readInt32LE(12),
      distanceStd: packet.payload.readInt32LE(16),
    }
  };
}

/**
 * UBX-HNR-PVT
 * @param {protocolMessage} packet
 * 
 */

function hnrPvt(packet) {
  const {gpsFixRaw, gpsFix} = decodeGPSFix(packet.payload.readUInt8(16));

  // GPSfixOK >1 = Fix within limits (e.g. DOP & accuracy)
  // DiffSoln 1 = DGPS used
  // WKNSET 1 = Valid GPS week number
  // TOWSET 1 = Valid GPS time of week (iTOW & fTOW)
  // headVehValid Heading of vehicle is valid
  const flags = {
    gpsFixOk: bitToBool(packet.payload.readUInt8(5), 0),
    diffSoln: bitToBool(packet.payload.readUInt8(5), 1),
    wknSet: bitToBool(packet.payload.readUInt8(5), 2),
    towSet: bitToBool(packet.payload.readUInt8(5), 3),
    headVehValid: bitToBool(packet.payload.readUInt8(5), 4)
  }; 

  // const valid = {
  //   validDate: bitToBool(packet.payload.readUInt8(17), 0), // valid UTC Date
  //   validTime: bitToBool(packet.payload.readUInt8(17), 1), // valid UTC Time of Day
  //   fullyResolved: bitToBool(packet.payload.readUInt8(17), 2),  // UTC Time of Day has been fully resolved (no seconds uncertainty). Cannot be used to check if time is completely solved
  // };

  return {
    type: 'HNR-PVT',
    iTOW: packet.payload.readUInt32LE(4),
    timeStamp: itowToDate(packet.payload.readUInt32LE(0)),
    data: {
      // turned these off for now; not needed
      // year: packet.payload.readUInt16LE(4),  // Year (UTC) [y]
      // month: packet.payload.readUInt8(6),    // Month, range 1..12 (UTC) [month]
      // day: packet.payload.readUInt8(7),      // Day of month, range 1..31 (UTC) [day]
      // hour: packet.payload.readUInt8(8),     // Hour of day, range 0..23 (UTC) [h]
      // minute: packet.payload.readUInt8(9),   // Minute of hour, range 0..59 (UTC)
      // second: packet.payload.readUInt8(10),  // Seconds of minute, range 0..60 (UTC) [s]
      // valid, // Validity flags
      //nano: packet.payload.readInt32LE(12),   // Fraction of second, range -1e9 .. 1e9 (UTC) [ns]
      gpsFix,
      gpsFixRaw,
      flags,
      // lon: packet.payload.readInt32LE(20) / 1e7,  // [deg]
      // lat: packet.payload.readInt32LE(24) / 1e7,  // [deg]
      // height: packet.payload.readInt32LE(28),     // Height above ellipsoid [mm]
      // hMSL: packet.payload.readInt32LE(32),       // Height above mean sea level [mm]
      gSpeed: packet.payload.readInt32LE(36),     // Ground Speed (2-D) [mm/s]
      speed: packet.payload.readInt32LE(40),      // Speed (3-D
      // headMot: packet.payload.readInt32LE(44) / 1e5, // Heading of motion (2-D) [deg]
      // headVeh: packet.payload.readInt32LE(48) / 1e5, // Heading of vehicle (2-D) [deg]
      // hAcc: packet.payload.readUInt32LE(52),       // Horizontal accuracy estimate [mm]
      // vAcc: packet.payload.readUInt32LE(56),       // Vertical accuracy estimate [mm]
      // sAcc: packet.payload.readUInt32LE(60),       // Speed accuracy estimate [mm/s]
      // headAcc: packet.payload.readUInt32LE(64),    // Heading accuracy estimate [deg]
    }
  };
}

/**
 * @param {protocolMessage} packet
 */


function sat(packet) {
  const satCount = packet.payload.readUInt8(5); // Number of satellites

  const sats = [];

  for (let i = 0; i < satCount; i += 1) {
    const flags = {
      qualityIndRaw: {
        // Signal quality indicator:
        bits: `${(packet.payload.readUInt8(16 + 12 * i) >> 2) % 2}${(packet.payload.readUInt8(16 + 12 * i) >> 1) % 2}${(packet.payload.readUInt8(16 + 12 * i) >> 0) % 2}`
      },
      svUsed: bitToBool(packet.payload.readUInt8(16 + 12 * i), 3),
      // Signal in the subset specified in Signal Identifiers is currently being used for navigation
      healthRaw: {
        // Signal health flag
        bits: `${(packet.payload.readUInt8(16 + 12 * i) >> 5) % 2}${(packet.payload.readUInt8(16 + 12 * i) >> 4) % 2}`
      },
      diffCorr: bitToBool(packet.payload.readUInt8(16 + 12 * i), 6),
      // differential correction data is available for this SV
      smoothed: bitToBool(packet.payload.readUInt8(16 + 12 * i), 7),
      // carrier smoothed pseudorange used
      orbitSourceRaw: {
        // Orbit source
        bits: `${(packet.payload.readUInt8(17 + 12 * i) >> 2) % 2}${(packet.payload.readUInt8(17 + 12 * i) >> 1) % 2}${(packet.payload.readUInt8(17 + 12 * i) >> 0) % 2}`
      },
      ephAvail: bitToBool(packet.payload.readUInt8(17 + 12 * i), 3),
      // ephemeris is available for this SV
      almAvail: bitToBool(packet.payload.readUInt8(17 + 12 * i), 4),
      // almanac is available for this SV
      anoAvail: bitToBool(packet.payload.readUInt8(17 + 12 * i), 5),
      // AssistNow Offline data is available for this SV
      aopAvail: bitToBool(packet.payload.readUInt8(17 + 12 * i), 6),
      // AssistNow Autonomous data is available for this SV
      sbasCorrUsed: bitToBool(packet.payload.readUInt8(18 + 12 * i), 0),
      // SBAS corrections have been used for a signal in the subset specified in Signal Identifier
      rtcmCorrUsed: bitToBool(packet.payload.readUInt8(18 + 12 * i), 1),
      // RTCM corrections have been used for a signal...
      slasCorrUsed: bitToBool(packet.payload.readUInt8(18 + 12 * i), 2),
      //  QZSS SLAS corrections have been used for a signal...
      prCorrUsed: bitToBool(packet.payload.readUInt8(18 + 12 * i), 4),
      // Pseudorange corrections have been used for a signal...
      crCorrUsed: bitToBool(packet.payload.readUInt8(18 + 12 * i), 5),
      // Carrier range corrections have been used for a signal...
      doCorrUsed: bitToBool(packet.payload.readUInt8(18 + 12 * i), 6) // Range rate (Doppler) corrections have been used for a signal...

    };

    switch (flags.qualityIndRaw.bits) {
      case '000':
        flags.qualityIndRaw.raw = 0;
        flags.qualityIndRaw.string = 'no signal';
        flags.qualityInd = 'no-signal';
        break;

      case '001':
        flags.qualityIndRaw.raw = 1;
        flags.qualityIndRaw.string = 'searching signal';
        flags.qualityInd = 'searching-signal';
        break;

      case '010':
        flags.qualityIndRaw.raw = 2;
        flags.qualityIndRaw.string = 'signal acquired';
        flags.qualityInd = 'signal-acquired';
        break;

      case '011':
        flags.qualityIndRaw.raw = 3;
        flags.qualityIndRaw.string = 'signal detected but unusable';
        flags.qualityInd = 'signal-detected';
        break;

      case '100':
        flags.qualityIndRaw.raw = 4;
        flags.qualityIndRaw.string = 'code locked and time synchronized';
        flags.qualityInd = 'code-locked';
        break;

      case '101':
        flags.qualityIndRaw.raw = 5;
        flags.qualityIndRaw.string = 'code and carrier locked and time synchronized';
        flags.qualityInd = 'code-carrier-locked';
        break;

      case '110':
        flags.qualityIndRaw.raw = 6;
        flags.qualityIndRaw.string = 'code and carrier locked and time synchronized';
        flags.qualityInd = 'code-carrier-locked';
        break;

      case '111':
        flags.qualityIndRaw.raw = 7;
        flags.qualityIndRaw.string = 'code and carrier locked and time synchronized';
        flags.qualityInd = 'code-carrier-locked';
        break;
    }

    switch (flags.healthRaw.bits) {
      case '00':
        flags.healthRaw.raw = 0;
        flags.healthRaw.string = 'unknown';
        break;

      case '01':
        flags.healthRaw.raw = 1;
        flags.healthRaw.string = 'healthy';
        break;

      case '10':
        flags.healthRaw.raw = 2;
        flags.healthRaw.string = 'unhealthy';
        break;
    }

    flags.health = flags.healthRaw.string; // all values fit convention

    switch (flags.orbitSourceRaw.bits) {
      case '000':
        flags.orbitSourceRaw.raw = 0;
        flags.orbitSourceRaw.string = 'no orbit information is available for this SV';
        flags.orbitSource = 'no-info';
        break;

      case '001':
        flags.orbitSourceRaw.raw = 1;
        flags.orbitSourceRaw.string = 'ephemeris is used';
        flags.orbitSource = 'ephemeris';
        break;

      case '010':
        flags.orbitSourceRaw.raw = 2;
        flags.orbitSourceRaw.string = 'almanac is used';
        flags.orbitSource = 'almanac';
        break;

      case '011':
        flags.orbitSourceRaw.raw = 3;
        flags.orbitSourceRaw.string = 'AssistNow Offline orbit is used';
        flags.orbitSource = 'assistnow-offline';
        break;

      case '100':
        flags.orbitSourceRaw.raw = 4;
        flags.orbitSourceRaw.string = 'AssistNow Autonomous orbit is used';
        flags.orbitSource = 'assistnow-autonomous';
        break;

      case '101':
        flags.orbitSourceRaw.raw = 5;
        flags.orbitSourceRaw.string = 'other orbit information is used';
        flags.orbitSource = 'other';
        break;

      case '110':
        flags.orbitSourceRaw.raw = 6;
        flags.orbitSourceRaw.string = 'other orbit information is used';
        flags.orbitSource = 'other';
        break;

      case '111':
        flags.orbitSourceRaw.raw = 7;
        flags.orbitSourceRaw.string = 'other orbit information is used';
        flags.orbitSource = 'other';
        break;
    }

    const gnssId = packet.payload.readUInt8(8 + 12 * i);
    sats.push({
      gnssRaw: {
        raw: gnssId,
        // GNSS identifier
        string: gnssIdentifiersInversed[gnssId]
      },
      gnss: gnssIdentifiersInversed[gnssId],
      svId: packet.payload.readUInt8(9 + 12 * i),
      // Satellite identifier
      cno: packet.payload.readUInt8(10 + 12 * i),
      // Carrier to noise ratio (signal strength) [dBHz]
      elev: packet.payload.readInt8(11 + 12 * i),
      // Elevation (range: +/-90), unknown if out of range [deg]
      azim: packet.payload.readInt16LE(12 + 12 * i),
      // Azimuth (range 0-360), unknown if elevation is out of range [deg]
      prRes: packet.payload.readInt16LE(14 + 12 * i) / 1e1,
      // Pseudorange residual [m]
      flags
    });
  }

  return {
    type: 'NAV-SAT',
    iTOW: packet.payload.readUInt32LE(0),
    timeStamp: itowToDate(packet.payload.readUInt32LE(0)),
    data: {
      iTOW: packet.payload.readUInt32LE(0),
      version: packet.payload.readUInt8(4),
      numSvs: packet.payload.readUInt8(5),
      sats
    }
  };
}

function sig(packet) {
  const sigCount = packet.payload.readUInt8(5); // Number of satellites

  const sigs = [];

  for (let i = 0; i < sigCount; i += 1) {
    const flagsLowByte = packet.payload.readUInt8(18 + 16 * i);
    const flags = {
      healthRaw: {
        // Signal health flag
        bits: `${(flagsLowByte >> 1) % 2}${(flagsLowByte >> 0) % 2}`
      },
      prSmoothed: bitToBool(flagsLowByte, 2),
      // Pseudorange has been smoothed
      prUsed: bitToBool(flagsLowByte, 3),
      // Pseudorange has been used for a signal...
      crUsed: bitToBool(flagsLowByte, 4),
      // Carrier range has been used for a signal...
      doUsed: bitToBool(flagsLowByte, 5),
      // Range rate (Doppler) has been used for a signal...
      prCorrUsed: bitToBool(flagsLowByte, 6),
      // Pseudorange corrections have been used for a signal...
      crCorrUsed: bitToBool(flagsLowByte, 7),
      // Carrier range corrections have been used for a signal...
      doCorrUsed: bitToBool(packet.payload.readUInt8(19 + 16 * i), 0) // Range rate (Doppler) corrections have been used for a signal...

    };

    switch (flags.healthRaw.bits) {
      case '00':
        flags.healthRaw.raw = 0;
        flags.healthRaw.string = 'unknown';
        break;

      case '01':
        flags.healthRaw.raw = 1;
        flags.healthRaw.string = 'healthy';
        break;

      case '10':
        flags.healthRaw.raw = 2;
        flags.healthRaw.string = 'unhealthy';
        break;
    }

    flags.health = flags.healthRaw.string; // all values fit convention
    // enums that are not a flag

    const qualityIndRaw = {
      raw: packet.payload.readUInt8(15 + 16 * i)
    }; // Signal quality indicator.

    let qualityInd = false;

    switch (qualityIndRaw.raw) {
      case 0:
        qualityIndRaw.string = 'no signal';
        qualityInd = 'no-signal';
        break;

      case 1:
        qualityIndRaw.string = 'searching signal';
        qualityInd = 'searching-signal';
        break;

      case 2:
        qualityIndRaw.string = 'signal acquired';
        qualityInd = 'signal-acquired';
        break;

      case 3:
        qualityIndRaw.string = 'signal detected but unusable';
        qualityInd = 'signal-detected';
        break;

      case 4:
        qualityIndRaw.string = 'code locked and time synchronized';
        qualityInd = 'code-locked';
        break;

      case 5:
      case 6:
      case 7:
        qualityIndRaw.string = 'code and carrier locked and time synchronized';
        qualityInd = 'code-carrier-locked';
        break;
    }

    const ionoModelRaw = {
      raw: packet.payload.readUInt8(17 + 16 * i)
    }; // Ionospheric model used

    let ionoModel = false;

    switch (ionoModelRaw.raw) {
      case 0:
        ionoModelRaw.string = 'No model';
        ionoModel = 'no-model';
        break;

      case 1:
        ionoModelRaw.string = 'Klobuchar model transmitted by GPS';
        ionoModel = 'klobuchar-gps';
        break;

      case 2:
        ionoModelRaw.string = 'SBAS model';
        ionoModel = 'sbas';
        break;

      case 3:
        ionoModelRaw.string = 'Klobuchar model transmitted by BeiDou';
        ionoModel = 'klobuchar-beidou';
        break;

      case 8:
        ionoModelRaw.string = 'Iono delay derived from dual frequency observations';
        ionoModel = 'dual-frequency';
        break;
    }

    const gnssId = packet.payload.readUInt8(8 + 16 * i); // GNSS identifier

    const sigId = packet.payload.readUInt8(10 + 16 * i); // New style signal identifier

    sigs.push({
      gnssId,
      // GNSS identifier
      gnss: gnssIdentifiersInversed[gnssId],
      svId: packet.payload.readUInt8(9 + 16 * i),
      // Satellite identifier
      sigId,
      // New style signal identifier
      sig: gnssSignalIdentifiersInversed[gnssId] ? gnssSignalIdentifiersInversed[gnssId][sigId] : false,
      freqId: packet.payload.readUInt8(11 + 16 * i),
      // Only used for GLONASS: This is the frequency slot + 7 (range from 0 to 13)
      prRes: packet.payload.readInt16LE(12 + 16 * i) / 1e1,
      // Pseudorange residual [m]
      cno: packet.payload.readUInt8(14 + 16 * i),
      // Carrier to noise ratio (signal strength) [dBHz]
      qualityInd,
      // Signal quality indicator.
      qualityIndRaw,
      ionoModel,
      // Ionospheric model used
      ionoModelRaw,
      flags
    });
  }

  return {
    type: 'NAV-SIG',
    iTOW: packet.payload.readUInt32LE(0),
    timeStamp: itowToDate(packet.payload.readUInt32LE(0)),
    data: {
      iTOW: packet.payload.readUInt32LE(0),
      version: packet.payload.readUInt8(4),
      numSigs: sigCount,
      sigs
    }
  };
}
/*
This message combines position, velocity and time solution, including accuracy
figures.
Note that during a leap second there may be more or less than 60 seconds in a
minute. See the section Leap seconds in Integration manual for details.
*/


function pvt(packet) {
  const gpsFixRaw = {
    value: packet.payload.readUInt8(20),
    string: ''
  };
  let gpsFix = '';

  switch (gpsFixRaw.value) {
    case 0x00:
      gpsFixRaw.string = 'no fix';
      gpsFix = 'no-fix';
      break;

    case 0x01:
      gpsFixRaw.string = 'dead reckoning only';
      gpsFix = 'dead-reckoning';
      break;

    case 0x02:
      gpsFixRaw.string = '2D-fix';
      gpsFix = '2d-fix';
      break;

    case 0x03:
      gpsFixRaw.string = '3D-fix';
      gpsFix = '3d-fix';
      break;

    case 0x04:
      gpsFixRaw.string = 'GPS + dead reckoning combined';
      gpsFix = 'gps+dead-reckoning';
      break;

    case 0x05:
      gpsFixRaw.string = 'Time only fix';
      gpsFix = 'time-only';
      break;

    default:
      gpsFixRaw.string = 'reserved';
      gpsFix = 'reserved';
      break;
  }

  const flags = {
    gnssFixOk: bitToBool(packet.payload.readUInt8(21), 0),
    // valid fix (i.e within DOP & accuracy masks)
    diffSoln: bitToBool(packet.payload.readUInt8(21), 1),
    // differential corrections were applied
    psmState: {
      // Power Save Mode state
      raw: 0,
      string: `${(packet.payload.readUInt8(21) >> 4) % 2}${(packet.payload.readUInt8(21) >> 3) % 2}${(packet.payload.readUInt8(21) >> 2) % 2}`
    },
    headVehValid: bitToBool(packet.payload.readUInt8(21), 5),
    // heading of vehicle is valid
    carrSolnRaw: {
      // Carrier phase range solution status
      bits: `${(packet.payload.readUInt8(21) >> 7) % 2}${(packet.payload.readUInt8(21) >> 6) % 2}`
    },
    // flags2
    confirmedAvai: bitToBool(packet.payload.readUInt8(22), 5),
    // information about UTC Date and Time of Day validity confirmation is available
    confirmedDate: bitToBool(packet.payload.readUInt8(22), 6),
    // UTC Date validity could be confirmed
    confirmedTime: bitToBool(packet.payload.readUInt8(22), 7),
    // UTC Time of Day could be confirmed
    // flags3
    invalidLlh: bitToBool(packet.payload.readUInt8(78), 0) //  Invalid lon, lat, height and hMSL

  };

  switch (flags.carrSolnRaw.bits) {
    case '00':
      flags.carrSoln = 'none';
      flags.carrSolnRaw.string = 'no carrier phase range solution';
      break;

    case '01':
      flags.carrSoln = 'float';
      flags.carrSolnRaw.string = 'carrier phase range solution with floating ambiguities';
      break;

    case '10':
      flags.carrSoln = 'fix';
      flags.carrSolnRaw.string = 'carrier phase range solution with fixed ambiguities';
      break;
  }

  const valid = {
    validDate: bitToBool(packet.payload.readUInt8(11), 0),
    // valid UTC Date
    validTime: bitToBool(packet.payload.readUInt8(11), 1),
    // valid UTC Time of Day
    fullyResolved: bitToBool(packet.payload.readUInt8(11), 2),
    // UTC Time of Day has been fully resolved (no seconds uncertainty). Cannot be used to check if time is completely solved
    validMag: bitToBool(packet.payload.readUInt8(11), 3) // valid Magnetic declination
  };
  return {
    type: 'NAV-PVT',
    iTOW: packet.payload.readUInt32LE(0),
    timeStamp: itowToDate(packet.payload.readUInt32LE(0)),
    data: {
      iTOW: packet.payload.readUInt32LE(0),
      year: packet.payload.readUInt16LE(4),
      // Year (UTC) [y]
      month: packet.payload.readUInt8(6),
      // Month, range 1..12 (UTC) [month]
      day: packet.payload.readUInt8(7),
      // Day of month, range 1..31 (UTC) [day]
      hour: packet.payload.readUInt8(8),
      // Hour of day, range 0..23 (UTC) [h]
      minute: packet.payload.readUInt8(9),
      // Minute of hour, range 0..59 (UTC) [min]
      second: packet.payload.readUInt8(10),
      // Seconds of minute, range 0..60 (UTC) [s]
      valid,
      // Validity flags
      tAcc: packet.payload.readUInt32LE(12),
      // Time accuracy estimate (UTC) [ns]
      nano: packet.payload.readInt32LE(16),
      // Fraction of second, range -1e9 .. 1e9 (UTC) [ns]
      fixType: gpsFix,
      fixTypeRaw: gpsFixRaw,
      flags,
      numSV: packet.payload.readUInt8(23),
      // Number of satellites used in Nav Solution
      lon: packet.payload.readInt32LE(24) / 1e7,
      // [deg]
      lat: packet.payload.readInt32LE(28) / 1e7,
      // [deg]
      height: packet.payload.readInt32LE(32),
      // Height above ellipsoid [mm]
      hMSL: packet.payload.readInt32LE(36),
      // Height above mean sea level [mm]
      hAcc: packet.payload.readUInt32LE(40),
      // [mm]
      vAcc: packet.payload.readUInt32LE(44),
      // [mm]
      velN: packet.payload.readInt32LE(48),
      // [mm/s]
      velE: packet.payload.readInt32LE(52),
      // [mm/s]
      velD: packet.payload.readInt32LE(56),
      // [mm/s]
      gSpeed: packet.payload.readInt32LE(60),
      // Ground Speed (2-D) [mm/s]
      headMot: packet.payload.readInt32LE(64) / 1e5,
      // Heading of motion (2-D) [deg]
      sAcc: packet.payload.readUInt32LE(68),
      // Speed accuracy estimate [mm/s]
      headAcc: packet.payload.readUInt32LE(72) / 1e5,
      // Heading accuracy estimate (both motion and vehicle) [deg]
      pDOP: packet.payload.readUInt16LE(76),
      // Position DOP
      headVeh: packet.payload.readInt32LE(84) / 1e5,
      // Heading of vehicle (2-D) [deg]
      magDec: packet.payload.readInt16LE(88) / 1e2,
      // Magnetic declination [deg]
      magAcc: packet.payload.readInt16LE(90) / 1e2 // Magnetic declination accuracy[deg]

    }
  };
}
/*
This message outputs the Geodetic position in the currently selected ellipsoid.
The default is the WGS84 Ellipsoid, but can be changed with the message
CFG-NAVSPG-USE_USRDAT.
*/

/**
 * @param {protocolMessage} packet
 */


function hpposllh(packet) {
  const flags = {
    invalidLlh: bitToBool(packet.payload.readUInt8(3), 0) //  Invalid lon, lat, height, hMSL, lonHp, latHp, heightHp and hMSLHp

  };
  return {
    type: 'NAV-HPPOSLLH',
    iTOW: packet.payload.readUInt32LE(4),
    timeStamp: itowToDate(packet.payload.readUInt32LE(4)),
    data: {
      flags,
      iTOW: packet.payload.readUInt32LE(4),
      lon: (packet.payload.readInt32LE(8) * 1e2 + packet.payload.readInt8(24)) / 1e9,
      // [deg]
      lat: (packet.payload.readInt32LE(12) * 1e2 + packet.payload.readInt8(25)) / 1e9,
      // [deg]
      height: packet.payload.readInt32LE(16) + packet.payload.readInt8(26) / 1e1,
      // [mm]
      hMSL: packet.payload.readInt32LE(20) + packet.payload.readInt8(27) / 1e1,
      // [mm]
      hAcc: packet.payload.readUInt32LE(28) / 1e1,
      // [mm]
      vAcc: packet.payload.readUInt32LE(32) / 1e1 // [mm]

    }
  };
}
/*
The NED frame is defined as the local topological system at the reference
station. The relative position vector components in this message, along with
their associated accuracies, are given in that local topological system
This message contains the relative position vector from the Reference Station
to the Rover, including accuracy figures, in the local topological system defined
at the reference station
*/


function relposned(packet) {
  const flags = {
    gnssFixOK: bitToBool(packet.payload.readUInt8(60), 0),
    // A valid fix (i.e within DOP & accuracy masks)
    diffSoln: bitToBool(packet.payload.readUInt8(60), 1),
    // 1 if differential corrections were applied
    relPosValid: bitToBool(packet.payload.readUInt8(60), 2),
    // 1 if relative position components and accuracies are valid and, in moving base mode only, if baseline is valid
    carrSolnRaw: {
      // Carrier phase range solution status
      bits: `${(packet.payload.readUInt8(60) >> 4) % 2}${(packet.payload.readUInt8(60) >> 3) % 2}`
    },
    isMoving: bitToBool(packet.payload.readUInt8(60), 5),
    // 1 if the receiver is operating in moving base mode
    refPosMiss: bitToBool(packet.payload.readUInt8(60), 6),
    // 1 if extrapolated reference position was used to compute moving base solution this epoch
    refObsMiss: bitToBool(packet.payload.readUInt8(60), 7),
    // 1 if extrapolated reference observations were used to compute moving base solution this epoch
    relPosHeadingValid: bitToBool(packet.payload.readUInt8(61), 0),
    // 1 if relPosHeading is valid
    relPosNormalized: bitToBool(packet.payload.readUInt8(61), 1) // 1 if the components of the relative position vector (including the high-precision parts) are normalized

  };

  switch (flags.carrSolnRaw.bits) {
    case '00':
      flags.carrSoln = 'none';
      flags.carrSolnRaw.string = 'no carrier phase range solution';
      break;

    case '01':
      flags.carrSoln = 'float';
      flags.carrSolnRaw.string = 'carrier phase range solution with floating ambiguities';
      break;

    case '10':
      flags.carrSoln = 'fix';
      flags.carrSolnRaw.string = 'carrier phase range solution with fixed ambiguities';
      break;
  }

  return {
    type: 'NAV-RELPOSNED',
    iTOW: packet.payload.readUInt32LE(4),
    timeStamp: itowToDate(packet.payload.readUInt32LE(4)),
    data: {
      refStationId: packet.payload.readUInt16LE(2),
      // Reference Station ID. Must be in the range 0..4095
      iTOW: packet.payload.readUInt32LE(4),
      relPosN: packet.payload.readInt32LE(8) * 10 + packet.payload.readInt8(32) / 1e1,
      // [mm]
      relPosE: packet.payload.readInt32LE(12) * 10 + packet.payload.readInt8(33) / 1e1,
      // [mm]
      relPosD: packet.payload.readInt32LE(16) * 10 + packet.payload.readInt8(34) / 1e1,
      // [mm]
      relPosLength: packet.payload.readInt32LE(20) * 10 + packet.payload.readInt8(35) / 1e1,
      // [mm]
      relPosHeading: packet.payload.readInt32LE(24) / 1e5,
      // [deg]
      accN: packet.payload.readUInt32LE(36) / 1e1,
      // Accuracy of relative position North component [mm]
      accE: packet.payload.readUInt32LE(40) / 1e1,
      // Accuracy of relative position East component [mm]
      accD: packet.payload.readUInt32LE(44) / 1e1,
      // Accuracy of relative position Down component [mm]
      accLength: packet.payload.readUInt32LE(48) / 1e1,
      // Accuracy of length of the relative position vector [mm]
      accHeading: packet.payload.readUInt32LE(52) / 1e5,
      // [deg]
      flags
    }
  };
}
/*
This message is intended to be used as a marker to collect all navigation
messages of an epoch. It is output after all enabled NAV class messages (except
UBX-NAV-HNR) and after all enabled NMEA messages.
*/

/**
 * @param {protocolMessage} packet
 */


function eoe(packet) {
  return {
    type: 'NAV-EOE',
    iTOW: packet.payload.readUInt32LE(0),
    timeStamp: itowToDate(packet.payload.readUInt32LE(0)),
    data: {
      iTOW: packet.payload.readUInt32LE(0)
    }
  };
}

var navFunctions = {
  status,
  posllh,
  velned,
  odo,
  sat,
  sig,
  pvt,
  hnrPvt,
  hpposllh,
  relposned,
  eoe,
  itowDiff
};

function trimEndNull(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000]+$/g, '');
} // payload length is expected to be 30 + 10 + 30N


function ver(packet) {
  const extensions = [];

  for (let i = 40; i < packet.payload.length; i += 30) {
    extensions.push(trimEndNull(packet.payload.toString('ascii', i, i + 30)));
  }

  return {
    type: 'MON-VER',
    data: {
      swVersion: trimEndNull(packet.payload.toString('ascii', 0, 30)),
      hwVersion: trimEndNull(packet.payload.toString('ascii', 30, 40)),
      extensions
    }
  };
} // payload length is expected to be 4 + 24N


function rf(packet) {
  const blocks = [];
  const version = packet.payload.readInt8(0);
  const nBlocks = packet.payload.readInt8(1); // check length

  if (version === 0 && packet.payload.length === 4 + 24 * nBlocks) {
    // parse blocks
    for (let i = 0; i < nBlocks; i += 1) {
      const flags = packet.payload.readInt8(5 + 24 * i); // lower two bits is "jammingState" - output from Jamming/Interference Monitor
      // jammingState - (0 = unknown or feature disabled, 1 = ok - no significant jamming, 2 = warning - interference visible but fix OK, 3 = critical - interference visible and no fix)

      blocks.push({
        blockId: packet.payload.readInt8(4 + 24 * i),
        jammingState: flags,
        antStatus: packet.payload.readUInt8(6 + 24 * i),
        // Status of the antenna supervisor state machine (0x00=INIT,0x01=DONTKNOW, 0x02=OK,0x03=SHORT,0x04=OPEN)
        antPower: packet.payload.readUInt8(7 + 24 * i),
        // Current power status of antenna (0x00=OFF,0x01=ON,0x02=DONTKNOW)
        postStatus: packet.payload.readUInt32LE(8 + 24 * i),
        // POST status word
        noisePerMS: packet.payload.readUInt16LE(16 + 24 * i),
        // Noise level as measured by the GPS core
        agcCnt: packet.payload.readUInt16LE(18 + 24 * i),
        // AGC Monitor (counts SIGHI xor SIGLO, range 0 to 8191)
        jamInd: packet.payload.readUInt8(20 + 24 * i),
        // CW jamming indicator, scaled (0=no CW jamming, 255 = strong CW jamming)
        ofsI: packet.payload.readInt8(21 + 24 * i),
        // Imbalance of I-part of complex signal, scaled (-128 = max. negative imbalance, 127 = max. positive imbalance)
        magI: packet.payload.readUInt8(22 + 24 * i),
        // Magnitude of I-part of complex signal, scaled (0= no signal, 255 = max. magnitude)
        ofsQ: packet.payload.readInt8(23 + 24 * i),
        // Imbalance of Q-part of complex signal, scaled (-128 = max. negative imbalance, 127 = max. positive imbalance)
        magQ: packet.payload.readUInt8(24 + 24 * i) // Magnitude of Q-part of complex signal, scaled (0= no signal, 255 = max. magnitude)

      });
    }
  }

  return {
    type: 'MON-RF',
    version,
    nBlocks,
    blocks
  };
}

var monFunctions = {
  ver,
  rf
};

/* eslint no-bitwise: "off" */
const debug = Debug('ubx:packet:parser');
class UBXPacketParser extends stream.Transform {
  constructor(options) {
    super({ ...options,
      objectMode: true
    });
  }
  /**
   * @typedef {object} protocolMessage
   * @property {number} messageClass
   * @property {number} messageId
   * @property {Buffer} payload
   */

  /**
   * @param {protocolMessage} chunk
   * @private
   */
  // eslint-disable-next-line no-underscore-dangle
  _transform(chunk, encoding, cb) {
    const packetType = `${chunk.messageClass}_${chunk.messageId}`;
    let result;

    switch (packetType) {
      case packetTypes['NAV-STATUS']:
        result = navFunctions.status(chunk);
        break;

      case packetTypes['NAV-VELNED']:
        result = navFunctions.velned(chunk);
        break;

        case packetTypes['NAV-ODO']:
          result = navFunctions.odo(chunk);
          break;

      case packetTypes['NAV-SAT']:
        result = navFunctions.sat(chunk);
        break;

      case packetTypes['NAV-SIG']:
        result = navFunctions.sig(chunk);
        break;

      case packetTypes['NAV-PVT']:
        result = navFunctions.pvt(chunk);
        break;

      case packetTypes['HNR-PVT']:
        result = navFunctions.hnrPvt(chunk);
        break;
      default:
        result = {}
        break;
    }

    this.push(result);
    cb();
  }

  static getPacketName(packetClass, packetId) {
    const packetType = `${packetClass}_${packetId}`;
    const packetTypeString = packetTypesInversed[packetType];
    return packetTypeString || 'UNKNOWN';
  }

  static itowDiff(itowStart, itowEnd) {
    return navFunctions.itowDiff(itowStart, itowEnd);
  }

}

export default UBXPacketParser;