import { exec } from 'child_process';
import isPi from './isPi.js';

let powerOffTimeout = null;
const SECOND_BEFORE_SHUTDOWN = 5

const shutdownPi = () => {
  console.log(' shutting down...');
  if (isPi()) {
    exec('sudo shutdown now ');
  }
}

const startPowerOff = () => {
  if (!powerOffTimeout){
    clearTimeout(powerOffTimeout);
    powerOffTimeout = setTimeout(() => shutdownPi(), SECOND_BEFORE_SHUTDOWN * 1000);
  }
}

const cancelPowerOff = () => {
  clearTimeout(powerOffTimeout);
}


export default {
  start: startPowerOff,
  stop: cancelPowerOff,
}

