let key = 0;
const keygen = (reset = false) => {
  if (reset) key = 0;
  key += 1;
  return key;
};

// when you change this, make sure Datastore.js is updated too
export const DATA_KEYS = {
  // Data From CAN BUS
  PEDAL_POSITION: keygen(),
  RPM: keygen(), // units 1 === 1 RPM
  RTC: keygen(), // RTC clock = not used or defined yet
  FUEL_PRESSURE: keygen(), // units 1 === 1 psi
  SPEEDO: keygen(), // Holley Speed = units 1 === 1 mph
  INJECTOR_PULSEWIDTH: keygen(),
  FUEL_FLOW: keygen(),
  CLOSED_LOOP_STATUS: keygen(),
  DUTY_CYCLE: keygen(),
  AFR_LEFT: keygen(), 
  CLOSED_LOOP_COMP: keygen(),
  AFR_RIGHT: keygen(),
  TARGET_AFR: keygen(), 
  AFR_AVERAGE: keygen(),
  IGNITION_TIMING: keygen(), // units 1 == 1 degree
  MAP: keygen(), // units 1 === 1 (PRESSURE_TYPE) (defaults to kpa if not set)
  KNOCK_RETARD: keygen(),
  MAT: keygen(), //manifold temp 
  TPS: keygen(),
  BAR_PRESSURE: keygen(),
  CTS: keygen(),   // coolant (defaults to F if TEMP_TYPE isnt set )
  OIL_PRESSURE: keygen(), // PSI
  BATT_VOLTAGE: keygen(),

  // Data from GPS
  ODOMETER: keygen(), // Current Miles Odometer
  TRIP_ODOMETER: keygen(), //
  GPS_SPEEED: keygen(), // Speed MPH
  // HEADING: keygen(),

  // Our Data
  WARNINGS: keygen(),
  FUEL_LEVEL: keygen(), // 0-100%
  CURRENT_MPG: keygen(),
  AVERAGE_MPG: keygen(),
  AVERAGE_MPG_POINTS: keygen(), // histogram of MPG points
  AVERAGE_MPG_POINT_INDEX: keygen(),
  LOW_LIGHT_DETECTED: keygen(),

  PRESSURE_TYPE: keygen(), // 0 for PSI, 1 for kpa
  TEMP_TYPE: keygen(), // 0 for F, 1 for C
};
Object.freeze(DATA_KEYS);

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
