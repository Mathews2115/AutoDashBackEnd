import { Gpio } from 'pigpio';
import os from 'os';

//  momentary swtich that is connected to a GPIO pin.
// with a led connected as well
export default class FuelLevelResetButton {
  /**
   * @param {{ (): void; (): void; }} onPressed
   */
  constructor(onPressed) {
    if(os.hostname() === 'raspberrypi') {
      console.log('loading switch');
      const led = new Gpio(26, {mode: Gpio.OUTPUT});
      this.odomResetButton = new Gpio(5, {
        mode: Gpio.INPUT,
        pullUpDown: Gpio.PUD_DOWN,
        edge: Gpio.EITHER_EDGE
      });

      // Level must be stable for 1000 ms before an alert event is emitted.
      // this.odomResetButton.glitchFilter(1000000);
      
      this.odomResetButton.on('interrupt', (level) => {
        console.log('interrupt', level)
        led.digitalWrite(level);
      });
      this.odomResetButton.on('alert', (level) => {
        console.log('alert', level)
        onPressed();
      });

    } else {
      console.log("No GPIO/Raspberry PI detected.  Not loading GPIO.");
    }
  }
}