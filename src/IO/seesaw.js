import i2c from 'i2c-bus';
import { performance } from 'perf_hooks';

const SWITCH1 = 18; // PA01
const SWITCH2 = 19; // PA02
const SWITCH3 = 20; // PA03
const SWITCH4 = 2; // PA06
const PWM1 = 12; // PC00
const PWM2 = 13; // PC01
const PWM3 = 0; // PA04
const PWM4 = 1; // PA05

const SEESAW_HW_ID_CODE_TINY8X7 = 0x87; // seesaw HW ID code for ATtiny817
const DEFAULT_I2C_ADDR = 0x3a;

const _STATUS_BASE = 0x00;
const _GPIO_BASE = 0x01;
const _SERCOM0_BASE = 0x02;
const _TIMER_BASE = 0x08;
const _ADC_BASE = 0x09;
const _DAC_BASE = 0x0a;
const _INTERRUPT_BASE = 0x0b;
const _DAP_BASE = 0x0c;
const _EEPROM_BASE = 0x0d;
const _TOUCH_BASE = 0x0f;
const _GPIO_DIRSET_BULK = 0x02;
const _GPIO_DIRCLR_BULK = 0x03;
const _GPIO_BULK = 0x04;
const _GPIO_BULK_SET = 0x05;
const _GPIO_BULK_CLR = 0x06;
const _GPIO_BULK_TOGGLE = 0x07;
const _GPIO_INTENSET = 0x08;
const _GPIO_INTENCLR = 0x09;
const _GPIO_INTFLAG = 0x0a;
const _GPIO_PULLENSET = 0x0b;
const _GPIO_PULLENCLR = 0x0c;
const _STATUS_HW_ID = 0x01;
const _STATUS_VERSION = 0x02;
const _STATUS_OPTIONS = 0x03;
const _STATUS_SWRST = 0x7f;
const _TIMER_STATUS = 0x00;
const _TIMER_PWM = 0x01;
const _TIMER_FREQ = 0x02;

const _HW_ID_CODE = 0x55;
const _EEPROM_I2C_ADDR = 0x3f;

/**
 * @param {number} x
 * @param {number} in_min
 * @param {number} in_max
 * @param {number} out_min
 * @param {number} out_max
 */
function map(x, in_min, in_max, out_min, out_max) {
  return ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}
/**
 * @param {number} ms
 */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), ms);
  });
}

let flashTimePassed = 0;

// TODO: make this work on all four switches; it just works on #1 right now
export class SeesawSwitch {
  /**
   * @param {number} [address]
   */
  constructor(address) {
    this.address = address || DEFAULT_I2C_ADDR;
    this.client = i2c.openSync(1).promisifiedBus();
    this.switchData = Buffer.alloc(4); // spots for 4 switches
    this.timeout = null;
    this.pulsateIncremente = 0;
    this.flashingSwitch = null;
  }

  async initialize() {
    await this.write(_STATUS_BASE, _STATUS_SWRST, Buffer.from[255]);
    // initial switches in seesaw adafruit board
    await this.setPinMode(SWITCH1);
    await this.setPinMode(SWITCH2);
    await this.setPinMode(SWITCH3);
    await this.setPinMode(SWITCH4);
  }

  /**
   * @param {number} pin
   */
  async setPinMode(pin) {
    const pins = 1 << pin;
    const cmd = Buffer.from([pins >> 24, pins >> 16, pins >> 8, pins]);

    // sett to pullup mode (TODO: i see we can probably just pass all the pins in at once)
    await this.write(_GPIO_BASE, _GPIO_DIRCLR_BULK, cmd);
    await this.write(_GPIO_BASE, _GPIO_PULLENSET, cmd);
    await this.write(_GPIO_BASE, _GPIO_BULK_SET, cmd);
  }

  /**
   * @param {number} pin
   * @param {number} value
   */
  analogWrite(pin, value) {
    const mappedVal = map(value, 0, 255, 0, 65535);
    return this.write(_TIMER_BASE, _TIMER_PWM, Buffer.from([pin, mappedVal >> 8, mappedVal]));
  }

  /**
   * @param {number} regBase
   * @param {number} reg
   * @param {Uint8Array | Buffer} [commandsBuffer]
   */
  async write(regBase, reg, commandsBuffer) {
    const registerAddr = Buffer.from([regBase, reg]);
    const fullBuffer = commandsBuffer
      ? Buffer.concat([registerAddr, commandsBuffer])
      : registerAddr;
    return this.client.i2cWrite(this.address, fullBuffer.length, fullBuffer);
  }

  /**
   * @param {number} pin
   */
  async getSwitchState(pin) {
    pin = 1 << pin;
    await this.read(_GPIO_BASE, _GPIO_BULK, this.switchData, this.switchData.length); // read all switch data into buffer
    await delay(15);
    return (
      pin
      & ((this.switchData[0] << 24)
        | (this.switchData[1] << 16)
        | (this.switchData[2] << 8)
        | this.switchData[3])
    );
  }

  /**
   * @param {number} regBase
   * @param {number} reg
   * @param {Buffer} buffer
   * @param {number} length
   */
  async read(regBase, reg, buffer, length) {
    await this.write(regBase, reg);
    await delay(15);
    return this.client.i2cRead(this.address, length, buffer);
  }

  async flashSwitch(s = SWITCH1) {
    if (!this.flashingSwitch) {
      this.flashingSwitch = s;
      flashTimePassed = performance.now();
    }
  }

  async pollSwitch() {
    try {
      const pressed = await this.getSwitchState(SWITCH1);
      if (pressed) {
        flashTimePassed = 0;
        this.flashingSwitch = null; // stop flashing
        this.pulsateIncremente += 25;
        await this.analogWrite(PWM1, this.pulsateIncremente);
        this.onButtonAction(0, true);
      } else if (this.pulsateIncremente) {
        this.pulsateIncremente = 0;
        await this.analogWrite(PWM1, 0);
        this.onButtonAction(0, false);
      } else if (this.flashingSwitch) {
        this.pulsateIncremente += 25;
        await this.analogWrite(PWM1, this.pulsateIncremente);
        if (performance.now() - flashTimePassed > 1500) {
          flashTimePassed = 0;
          this.flashingSwitch = null; // stop flashing
          this.pulsateIncremente = 0;
          await this.analogWrite(PWM1, 0);
        }
      }
      this.timeout = setTimeout(() => this.pollSwitch(), 66);
    } catch (e) {
      clearTimeout(this.timeout);
      this.onError(e);
    }
  }

  /**
   * @param {Function} onButtonAction
   */
  async start(onButtonAction) {
    this.onButtonAction = onButtonAction;
    try {
      await this.initialize();
      console.log('Buttons initialized');
      this.pollSwitch();
    } catch (e) {
      clearTimeout(this.timeout);
      this.onError(e);
    }
  }

  /**
   * @param {any} err
   */
  onError(err) {
    console.error(err);
    this.stop();
  }

  stop() {
    this.client.close();
  }
}
