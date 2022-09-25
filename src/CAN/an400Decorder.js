/**
 * CAN Bus Details
    • 250 kbps Rate
    • Broadcast parameters are based on SAE J1939 standard
    • All 2 byte data is stored [LowByte, HighByte] (little endian)
            Num = HighByte*256 + LowByte
    • Conversion from 2 bytes to signed int is per the following:
          Num = HighByte*256+LowByte
          if (Num>32767) then
            Num = Num - 65536
          endif
 */

import { DATA_MAP } from "../dataKeys.js";


const AN_400_DECODER= {
  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range     Type
    0CFFF048      PE1         50  1-2           2 bytes Rpm   rpm           1           0 to 30000      unsigned int
                                  3-4           2 bytes TPS     %          0.1          0 to 100        signed int
                                  5-6           2 bytes Fuel  Open Time ms  0.1         0 to 30         signed int
                                  7-8           2 bytes       Ignition Angle deg  0.1   -20 to 100  signed int
   * @param {Buffer} data
   */
  0x0cfff048: (data) => {
    return [
      { id: DATA_MAP.RPM, data: data.readUint16LE(0) },
      { id: DATA_MAP.TPS, data: data.readInt16LE(2) },
      // { },
      { id: DATA_MAP.IGNITION_TIMING, data: data.readInt16LE(6) },
    ];
  },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length    Name          Units       Resolution per bit    Range           Type
    0CFFF148    PE2       50        1-2         2 bytes   Barometer     psi or kpa  0.01                  0-300           signed int
                                    3-4         2 bytes   MAP           psi or kpa  0.01                  0-300           signed int
                                    5-6         2 bytes   Lambda        lambda      0.01                  0-10            signed int
                                    7.1         1 bit     Pressure Type (0 - psi,1-kPa)                                   unsigned char
   * @param {Buffer} data
   */
  0x0CFFF148: (data) => {
    return [
      { id: DATA_MAP.BAR_PRESSURE, data: data.readInt16LE(0) },
      { id: DATA_MAP.MAP, data: data.readInt16LE(2) },
      // {}, // feel free to add a datakey for this
      { id: DATA_MAP.PRESSURE_TYPE, data: data.readUint8(6) },
    ];
  },

  /** CAN ID (hex)  Name  Rate (ms) Start Position  Length    Name              Units   Resolution per bit    Range   Type
    0CFFF248        PE3     100         1-2         2 bytes   Analog Input #1   volts   0.001                 0 to 5  signed int
                                        3-4         2 bytes   Analog Input #2   volts   0.001                 0 to 5 signed int
                                        5-6         2 bytes   Analog Input #3   volts   0.001                 0 to 5 signed int
                                        7-8         2 bytes   Analog Input #4   volts   0.001                 0 to 5 signed int
   */
  // 0x0CFFF248: (data) => {
  //   // feel free to create datakeys for this and handle it
  //   return [];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
    0CFFF348 PE4 100 1-2 2 bytes Analog Input #5 volts 0.001 0 to 5 signed int
3-4 2 bytes Analog Input #6 volts 0.001 0 to 5 signed int
5-6 2 bytes Analog Input #7 volts 0.001 0 to 5 signed int
7-8 2 bytes Analog Input #8 volts 0.001 0 to 22 signed int
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFF348: (data) => {
  //   // feel free to create datakeys for this and handle it
  //   return [];
  // },


  /**
   *CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
    0CFFF448 PE5 100  1-2   2 bytes   Frequency 1 hz 0.2 0 to 6000 signed int
                      3-4   2 bytes   Frequency 2 hz 0.2 0 to 6000 signed int
                      5-6   2 bytes   Frequency 3 hz 0.2 0 to 6000 signed int
                      7-8   2 bytes   Frequency 4 hz 0.2 0 to 6000 signed int
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFF448: (data) => {
  //   // feel free to create datakeys for this and handle it
  //   return [

  //   ];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
    0CFFF548 PE6 1000 1-2   2 bytes   Battery Volt  volts   0.01    0 to 22             signed int
                      3-4   2 bytes   Air Temp      C or F          0.1 -1000 to 1000  signed int
                      5-6   2 bytes   Coolant Temp  C or F          0.1 -1000 to 1000  signed int
                      7.1   1 bit     Temp Type     0 - F, 1 - C                        unsigned char
   * @param {Buffer} data
   * @returns
   */
  0x0CFFF548: (data) => {
    return [
      { id: DATA_MAP.BATT_VOLTAGE, data: data.readInt16LE(0) },
      { id: DATA_MAP.MAT, data: data.readInt16LE(2) },
      { id: DATA_MAP.CTS, data: data.readInt16LE(4) },
      { id: DATA_MAP.TEMP_TYPE, data: data.readUInt8(6) },
    ];
  },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
    0CFFF648 PE7 1000   1-2   2 bytes         Analog Input #5 - Thermistor C or F 0.1 -1000 to 1000 signed int
                        3-4   2 bytes         Analog Input #7 - Thermistor C or F 0.1 -1000 to 1000 signed int
                        5     1 byte          Version Major 1 0-255 unsigned char
                        6     1 byte          Version Minor 1 0-255 unsigned char
                        7     1 byte          Version Build 1 0-255 unsigned char
                        8     1 byte TBD
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFF648: (data) => {
  //   return [
  //   ];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
    0CFFF748 PE8 100 1-2 2 bytes RPM Rate rpm/sec 1 -10,000 to 10,000 signed int
3-4 2 bytes TPS Rate %/sec 1 -3,000 to 3,000 signed int
5-6 2 bytes MAP Rate psi/sec or kpa/sec 1 -3,000 to 3,000 signed int
7-8 2 bytes MAF Load Rate g/rev/sec 0.1 -300 to 300 signed int
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFF748: (data) => {
  //   return [{}];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
0CFFF848 PE9 100 1-2 2 bytes Lambda #1 Measured lambda 0.01 0 to 10 signed int
3-4 2 bytes Lambda #2 Measured lambda 0.01 0 to 10 signed int
5-6 2 bytes Target Lambda lambda 0.01 0 to 2.5 signed int
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFF848: (data) => {
  //   return [{}];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
0CFFF948 PE10 100 1 1 byte PWM Duty Cycle #1 % 0.5 0 to 100 unsigned char
2 1 byte PWM Duty Cycle #2 % 0.5 0 to 100 unsigned char
3 1 byte PWM Duty Cycle #3 % 0.5 0 to 100 unsigned char
4 1 byte PWM Duty Cycle #4 % 0.5 0 to 100 unsigned char
5 1 byte PWM Duty Cycle #5 % 0.5 0 to 100 unsigned char
6 1 byte PWM Duty Cycle #6 % 0.5 0 to 100 unsigned char
7 1 byte PWM Duty Cycle #7 % 0.5 0 to 100 unsigned char
8 1 byte PWM Duty Cycle #8 % 0.5 0 to 100 unsigned char
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFF948: (data) => {
  //   return [{}];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
0CFFFA48 PE11 100 1-2 2 bytes Percent Slip % 0.1 -3000 to 3000 signed int
3-4 2 bytes Driven Wheel Rate of Change ft/sec/sec 0.1 -3000 to 3000 signed int
5-6 2 bytes Desired Value % 0.1 -3000 to 3000 signed int
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFFA48: (data) => {
  //   return [{}];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
0CFFFB48 PE12 100 1-2 2 bytes Driven Avg Wheel Speed ft/sec 0.1 0 to 3000 unsigned int
3-4 2 bytes Non-Driven Avg Wheel Speed ft/sec 0.1 0 to 3000 unsigned int
5-6 2 bytes Ignition Compensation deg 0.1 0 to 100 signed int
7-8 2 bytes Ignition Cut Percent % 0.1 0 to 100 signed int
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFFB48: (data) => {
  //   return [{}];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
0CFFFC48 PE13 100 1-2 2 bytes Driven Wheel Speed #1 ft/sec 0.1 0 to 3000 unsigned int
3-4 2 bytes Driven Wheel Speed #2 ft/sec 0.1 0 to 3000 unsigned int
5-6 2 bytes Non-Driven Wheel Speed #1 ft/sec 0.1 0 to 3000 unsigned int
7-8 2 bytes Non-Driven Wheel Speed #2 ft/sec 0.1 0 to 3000 unsigned int
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFFC48: (data) => {
  //   return [{}];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
0CFFFD48 PE14 100 1-2 2 bytes Fuel Comp - Accel % 0.1 0 to 500 signed int
3-4 2 bytes Fuel Comp - Starting % 0.1 0 to 500 signed int
5-6 2 bytes Fuel Comp - Air Temp % 0.1 0 to 500 signed int
7-8 2 bytes Fuel Comp - Coolant Temp % 0.1 0 to 500 signed int
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFFD48: (data) => {
  //   return [{}];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
0CFFFE48 PE15 100 1-2 2 bytes Fuel Comp - Barometer % 0.1 0 to 500 signed int
3-4 2 bytes Fuel Comp - MAP % 0.1 0 to 500 signed int
5-6 2 bytes -
7-8 2 bytes -
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFFE48: (data) => {
  //   return [{}];
  // },

  /**
   * CAN ID (hex) Name Rate (ms) Start Position Length Name Units   Resolution per bit      Range Type
0CFFD048 PE16 100 1-2 2 bytes Ignition Comp - Air Temp deg 0.1 -20 to 20 signed int
3-4 2 bytes Ignition Comp - Coolant Temp deg 0.1 -20 to 20 signed int
5-6 2 bytes Ignition Comp - Barometer deg 0.1 -20 to 20 signed int
7-8 2 bytes Ignition Comp - MAP deg 0.1 -20 to 20 signed int
   * @param {Buffer} data
   * @returns
   */
  // 0x0CFFD048: (data) => {
  //   return [{}];
  // },
};

const an400Decoder = {
  /**
   * @param {{ ts: number; id: number; data: Uint8Array; ext: boolean; }} canMsg
   * @returns {[{id:Number, data:Number}] | []}
   */
  do: (canMsg) => {
    if (!!AN_400_DECODER[canMsg.id]) {
      return AN_400_DECODER[canMsg.id](Buffer.from(canMsg.data.buffer));
    } else {
      return [];
    }
  },
};

export default an400Decoder;
