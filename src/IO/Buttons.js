import os from 'os';
import { performance } from 'perf_hooks';
import { SeesawSwitch } from './seesaw.js';

//  momentary swtich that is connected to a GPIO pin.
// with a led connected as well
export default class Buttons {
  /**
   * @param {{ onAction: Function; holdNeeded: boolean|null; }} button1
   */
  constructor(button1) {
    if (os.hostname() === 'raspberrypi') {
      this.devices = new SeesawSwitch();
    }
    // seesawswitch has spots for 4 switches
    // TODO: make this work on all four switches; it just works on #1 right now

    /**
     * @type {Array<{ pressed: boolean|null, onAction: Function|null; holdNeeded: boolean|null; pressedSince:number|null}>}
     */
    this.buttons = [
      {
        onAction: button1.onAction || (() => {}),
        pressed: false,
        holdNeeded: button1.holdNeeded,
        pressedSince: null,
      },
    ];
  }

  /**
   * @param {number} btnNum
   * @param {Boolean} action
   */
  onAction(btnNum, action) {
    if (btnNum < this.buttons.length) {
      if (action) {
        this.onPressed(this.buttons[btnNum]);
      } else {
        this.onReleased(this.buttons[btnNum]);
      }
    }
  }

  /**
   * @param {{ pressed: any; onAction: any; holdNeeded: any; pressedSince: any; }} button
   */
  onPressed(button) {
    if (!button.pressed) {
      button.pressed = true;
      button.pressedSince = performance.now();
      if (!button.holdNeeded) {
        button.onAction();
      }
    }
  }

  /**
   * @param {{ pressed?: boolean; onAction: any; holdNeeded: any; pressedSince: any; }} button
   */
  onReleased(button) {
    if (button.pressed) {
      if (!button.holdNeeded) {
        button.onAction();
      }
      else if (performance.now() - button.pressedSince > 3000) {
        this.devices.flashSwitch();
        button.onAction();
      }
      // else no action needed;
      button.pressed = false;
    }
  }

  start() {
    if (this.devices) {
      this.devices.start(this.onAction.bind(this));
    }
  }

  stop() {
    if (this.devices) {
      this.devices.stop();
    }
  }
}
