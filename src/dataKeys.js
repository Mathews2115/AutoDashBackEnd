import { TYPES } from "./lib/PacketEntry.js";

let key = 0;
const keygen = (reset = false) => {
  if (reset) key = 0;
  return key++;
};

// ADDING ANOTHER DATA KEY:
/**
 * 1. add this anywhere in DATA_MAP:
 *     YOUR_NEW_KEY: { id: keygen(), byteType: TYPES.XXX },
 * 2. Copy DATA_MAP, and replace the DATA_MAP on front end: in DataMap.js
 * 3. Rebuild!
 */


/**
 * @typedef {{ id: number, byteType: number; }} DataMapEntry
 */


export const DATA_MAP = {
  // Data From CAN BUS
  PEDAL_POSITION: { id: keygen(), byteType: TYPES.INT8 },  // xxx percent
  RPM: { id: keygen(), byteType: TYPES.INT16 }, // units 1 === 1 RPM,  xx,xxx
  // RTC: { id: keygen(), byteType: TYPES.FOUR_BYTES }, // RTC clock = not used or defined yet
  FUEL_PRESSURE: { id: keygen(), byteType: TYPES.INT16 }, // units 1 === 1 psi
  SPEEDO: { id: keygen(), byteType: TYPES.INT16 }, // Holley Speed = units 1 === 1 mph
  INJECTOR_PULSEWIDTH: { id: keygen(), byteType: TYPES.INT16 },
  FUEL_FLOW: { id: keygen(), byteType: TYPES.INT16 }, // x,xxx pounds/hour
  CLOSED_LOOP_STATUS: { id: keygen(), byteType: TYPES.INT8 },
  DUTY_CYCLE: { id: keygen(), byteType: TYPES.INT8 },
  AFR_LEFT: { id: keygen(), byteType: TYPES.FLOAT }, // xx.x A/F
  CLOSED_LOOP_COMP: { id: keygen(), byteType: TYPES.INT16 },
  AFR_RIGHT: { id: keygen(), byteType: TYPES.FLOAT }, // xx.x A/F
  TARGET_AFR:{ id: keygen(), byteType: TYPES.FLOAT }, // xx.x A/F
  AFR_AVERAGE: { id: keygen(), byteType: TYPES.FLOAT }, // xx.x A/F
  IGNITION_TIMING:{ id: keygen(), byteType: TYPES.FLOAT }, // units 1 == 1 degree
  MAP: { id: keygen(), byteType: TYPES.INT16 }, // units 1 === 1 (PRESSURE_TYPE) (defaults to kpa if not set)
  KNOCK_RETARD: { id: keygen(), byteType: TYPES.INT16 },
  MAT: { id: keygen(), byteType: TYPES.INT16 }, //manifold temp 
  TPS: { id: keygen(), byteType: TYPES.INT8 },
  BAR_PRESSURE: { id: keygen(), byteType: TYPES.FLOAT },// xxx.x kPa
  CTS: { id: keygen(), byteType: TYPES.INT16 },  // coolant (defaults to F if TEMP_TYPE isnt set )
  OIL_PRESSURE: { id: keygen(), byteType: TYPES.INT16 }, // PSI  // xxx   psi
  BATT_VOLTAGE: { id: keygen(), byteType: TYPES.FLOAT }, // xx.x volts

  // Data from GPS
  ODOMETER:{ id: keygen(), byteType: TYPES.INT16 },// Current Miles Odometer
  TRIP_ODOMETER: { id: keygen(), byteType: TYPES.INT16 }, //
  GPS_SPEEED: { id: keygen(), byteType: TYPES.INT16 }, // Speed MPH

  WARNINGS: { id: keygen(), byteType: TYPES.BITFIELD }, // see warning keys

  FUEL_LEVEL: { id: keygen(), byteType: TYPES.INT8 }, // 0-100%
  CURRENT_MPG: { id: keygen(), byteType: TYPES.FLOAT },
  AVERAGE_MPG: { id: keygen(), byteType: TYPES.FLOAT },
  AVERAGE_MPG_POINTS: { id: keygen(), byteType: TYPES.SPECIAL_ARRAY }, // histogram of MPG points
  AVERAGE_MPG_POINT_INDEX: { id: keygen(), byteType: TYPES.INT8 },
  LOW_LIGHT_DETECTED: { id: keygen(), byteType: TYPES.INT8 },

  // TODO: ;just make a single bitfield for these types of things
  PRESSURE_TYPE: { id: keygen(), byteType: TYPES.INT8 }, // 0 for PSI, 1 for kpa
  TEMP_TYPE: { id: keygen(), byteType: TYPES.INT8 }, // 0 for F, 1 for C

  ///
  HV_BATT_VOLTAGE: { id: keygen(), byteType: TYPES.FLOAT }, // xx.x volts
  SOME_NEW_VALUE: { id: keygen(), byteType: TYPES.UINT32 },
};
Object.freeze(DATA_MAP);

// Keys for handling the WARNINGS Structure
const firstWarningKey = keygen();
export const WARNING_KEYS = {
  FIRST: firstWarningKey,
  BATT_VOLTAGE: firstWarningKey, // voltage too low
  OIL_PRESSURE: keygen(), // pressure too low
  LOW_FUEL: keygen(),
  ENGINE_TEMPERATURE: keygen(), // temp too high
  ECU_COMM: keygen(), // trouble communicating with ECU via CAN
  GPS_NOT_ACQUIRED: keygen(), // GPS working / or no 2d/3d fix aqcuired yet
  GPS_ERROR: keygen(), // some sort of untracked error occurred
  COMM_ERROR: keygen(),
};
Object.freeze(WARNING_KEYS);


// // simplify DATA_KEYS to ids from [{key: { id: number; byte?: number; }}] to [{key: id}]
// // @type {Record<string, number>}
// export const DATA_KEYS = Object.entries(DATA_KEY_MAP).reduce((acc, [k, v]) => {
//   acc[k] = v.id;
//   return acc;
// }, {});
