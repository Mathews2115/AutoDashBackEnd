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

  // Our Data
  WARNINGS: keygen(),
};
Object.freeze(DATA_KEYS);

// Keys for handling the WARNINGS Structure
export const WARNING_KEYS = {
  BATT_VOLTAGE: keygen(true), // voltage too low
  OIL_PRESSURE: keygen(), // pressure too low
  ENGINE_TEMPERATURE: keygen(), // temp too high
  ECU_COMM: keygen(), // trouble communicating with ECU via CAN
  GPS_NOT_ACQUIRED: keygen(), // GPS working but no 2d/3d fix aqcuired yet
  GPS_ERROR: keygen(), // some sort of untracked error occurred
  COMM_ERROR: keygen(), 
}
Object.freeze(WARNING_KEYS);

