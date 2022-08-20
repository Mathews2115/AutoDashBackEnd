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

//  The module base addresses for different seesaw modules.
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

/** GPIO module function address registers  */
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

// status module function address registers
const _STATUS_HW_ID = 0x01;
const _STATUS_VERSION = 0x02;
const _STATUS_OPTIONS = 0x03;
const _STATUS_SWRST = 0x7f;

// timer module function address registers
const _TIMER_STATUS = 0x00;
const _TIMER_PWM = 0x01;
const _TIMER_FREQ = 0x02;

const _HW_ID_CODE = 0x55;
const _EEPROM_I2C_ADDR = 0x3f;

const OFF_LED_LEVEL = 15;

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

export class SeesawSwitch {
  /**
   * @param {number} [address]
   */
  constructor(address) {
    this.address = address || DEFAULT_I2C_ADDR;
    this.switchData = Buffer.alloc(4); // spots for 4 switches
    this.timeout = null;
    this.buttonState = [
      {id: 0, pressed: false, depressing: false, switchPin: SWITCH1, PWM: PWM1, pulsateIncremente: 0}, 
      {id: 1, pressed: false, depressing: false, switchPin: SWITCH2, PWM: PWM2, pulsateIncremente: 0}, 
      {id: 2, pressed: false, depressing: false, switchPin: SWITCH3, PWM: PWM3, pulsateIncremente: 0},  
      {id: 3, pressed: false, depressing: false, switchPin: SWITCH4, PWM: PWM4, pulsateIncremente: 0}, 
    ];
  }

   async initialize() {
    try {
      this.client = await i2c.openPromisified(1);
      const result = await this.write(_STATUS_BASE, _STATUS_SWRST, Buffer.from[0xFF]); // reset everything to default values
      if (!result || !result.bytesWritten) {
         throw ("Failed to reset i2c device")
      }
      await delay(50)
      // initial switches in seesaw adafruit board
      await this.setPinMode(SWITCH1);
      await this.setPinMode(SWITCH2);
      await this.setPinMode(SWITCH3);
      await this.setPinMode(SWITCH4);
      await this.analogWrite(PWM1,OFF_LED_LEVEL);
      await this.analogWrite(PWM2,OFF_LED_LEVEL);
      await this.analogWrite(PWM3,OFF_LED_LEVEL);
      return delay(10);
    } catch (e) {
      clearTimeout(this.timeout);
      this.onError(e);
      return delay(0);
    }
  }

  async flashbutton(button) {
    button.pulsateIncremente -= 25;
    await this.analogWrite(button.PWM, button.pulsateIncremente);
    await delay(50)
    if (button.pulsateIncremente > 0) {
      return this.flashbutton(button);
    } else {
      return Promise.resolve();
    }
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
    return this.write(_GPIO_BASE, _GPIO_BULK_SET, cmd);
  }

  /**
   * @param {number} pin
   * @param {number} value
   */
 async analogWrite(pin, value) {
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
    const fullBuffer = commandsBuffer ? Buffer.concat([registerAddr, commandsBuffer]) : registerAddr;
    return this.client.i2cWrite(this.address, fullBuffer.length, fullBuffer);
  }

  async getSwitchesState() {
     await this.read(_GPIO_BASE, _GPIO_BULK, this.switchData, this.switchData.length); // read all switch data into buffer
    return Promise.resolve([
      this.getSwitchState(SWITCH1),
      this.getSwitchState(SWITCH2),
      this.getSwitchState(SWITCH3),
      this.getSwitchState(SWITCH4),
    ])
  }
  /**
   * @param {number} pin
   * @return  the status of the pin. HIGH or LOW (1 or 0).
   */
  getSwitchState(pin) {
    pin = 1 << pin;
    const state = pin & ((this.switchData[0] << 24) | (this.switchData[1] << 16) | (this.switchData[2] << 8) | this.switchData[3]);
    return state != 0;
  }

  /**
   * Digital Reaed
   * @param {number} regBase
   * @param {number} reg
   * @param {Buffer} buffer
   * @param {number} length
   */
   async read(regBase, reg, buffer, length) {
    const result = this.write(regBase, reg);
    if (result) {
      await delay(50);
      return this.client.i2cRead(this.address, length, buffer);
    } else {
      return Promise.resolve(0)
    }
  }

  async onPressedSignal(button) {
    if(!button.pressed) {
      button.pressed = true; // mark button was pressed and begin the debounce timer
      this.onButtonAction(button.id, true);
    } else {
      // cancel depress
      clearTimeout(button.depressing);
      button.depressing = false;
    }
    // debounce time has passed - ack button press
    button.pulsateIncremente += 25;
    await this.analogWrite(button.PWM, button.pulsateIncremente);
    return Promise.resolve();
  }

   async onReleasedSignal(button) {
    if (button.pressed && !button.depressing) {
      button.depressing = setTimeout(async () => {
        button.depressing = false;
        button.pressed = false;
        this.onButtonAction(button.id, false);

        button.pulsateIncremente = 700;
        await this.flashbutton(button);
        await this.analogWrite(button.PWM, OFF_LED_LEVEL);
      },100)
    }
    Promise.resolve();
  }

  async handleSwitchStates(buttonHigh, button) {
    if (!buttonHigh) {
      return this.onPressedSignal(button);
    } else if (button.pressed) {
      return this.onReleasedSignal(button);
    }
  }

   async pollSwitch() {
    try {
      let buttonStates = await this.getSwitchesState();
      buttonStates.forEach(async (state, i) => await this.handleSwitchStates(state, this.buttonState[i]));
      this.timeout = setTimeout(() => this.pollSwitch(), 33);
    } catch (e) {
      clearTimeout(this.timeout);
      this.onError(e);
    }
  }

  /**
   * @param {Function} onButtonAction
   */
   start(onButtonAction) {
    this.onButtonAction = onButtonAction;
    this.initialize().then(() => {
      console.log('AutoDash: Buttons initialized');
      this.pollSwitch();
    });
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
