
export const decodeGPSFix = (/** @type {number} */ rawData) => {
  const gpsFixRaw = {
    value: rawData,
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
  return { gpsFixRaw, gpsFix };
}
