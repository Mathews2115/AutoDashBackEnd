let key = 0;
const keygen = (reset = false) => {
  if (reset) key = 0;
  return key++; 
}

export const DATA_KEYS = {
  // Data From CAN BUS
  PEDAL_POSITION: keygen(),
  RPM: keygen(),
  RTC: keygen(),
  FUEL_PRESSURE: keygen(),
  SPEEDO: keygen(),
  INJECTOR_PULSEWIDTH: keygen(),
  FUEL_FLOW: keygen(),
  CLOSED_LOOP_STATUS: keygen(),
  DUTY_CYCLE: keygen(),
  AFR_LEFT: keygen(),
  CLOSED_LOOP_COMP: keygen(),
  AFR_RIGHT: keygen(),
  TARGET_AFR: keygen(),
  AFR_AVERAGE: keygen(),
  IGNITION_TIMING: keygen(),
  MAP: keygen(),
  KNOCK_RETARD: keygen(),
  MAT: keygen(),
  TPS: keygen(),
  BAR_PRESSURE: keygen(),
  CTS: keygen(),
  OIL_PRESSURE: keygen(),
  BATT_VOLTAGE: keygen(),

  // Data from GPS
  ODOMETER: keygen(),
  TRIP_ODOMETER: keygen(), //
  GPS_SPEEED: keygen(), //m
  // HEADING: keygen(),

  // Our Data
  WARNINGS: keygen(),
  FUEL_LEVEL: keygen(),
  CURRENT_MPG: keygen(),
  AVERAGE_MPG: keygen(),
  AVERAGE_MPG_POINTS: keygen(),
  AVERAGE_MPG_POINT_INDEX: keygen(),
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
}
Object.freeze(WARNING_KEYS);

