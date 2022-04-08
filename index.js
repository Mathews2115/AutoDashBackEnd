import app from './src/app.js';
import yaml from 'js-yaml';
import fs from 'fs';

//  https://nodejs.org/dist/latest-v14.x/docs/api/process.html#process_process
// env vars we will use
const CAN_CHANNEL =  process.env.CHANNEL
const NODE_ENV = process.env.NODE_ENV

try {
  const settings = yaml.load(fs.readFileSync('./settings.yaml', 'utf8'));
  const dashServer = app(CAN_CHANNEL, settings);

  // Development or Live (starts webserver if live)
  // const APP_TYPE = process.env.TYPE || dashServer.TYPES.DEVELOPMENT

  const stopAll = () => {
    dashServer.stop();
  }
  process.on('SIGTERM', stopAll)
  process.on('SIGINT', stopAll)
  dashServer.start();
} catch (e) {
  console.log(e);
}




