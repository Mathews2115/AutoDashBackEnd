import app from './src/app.js';
import yaml from 'js-yaml';
import fs from 'fs';

//  https://nodejs.org/dist/latest-v14.x/docs/api/process.html#process_process
// env vars we will use
const CAN_CHANNEL =  process.env.CHANNEL
const NODE_ENV = process.env.NODE_ENV
const DEMO = process.env.DEMO

try {
  const settings = yaml.load(fs.readFileSync('./settings.yaml', 'utf8'));
  const dashServer = app({
    canChannel: CAN_CHANNEL,
    demo: !!DEMO,
    env: NODE_ENV
  }, settings);

  const stopAll = () => {
    dashServer.stop();
  }
  process.on('SIGTERM', stopAll)
  process.on('SIGINT', stopAll)
  dashServer.start();
} catch (e) {
  console.log(e);
}




