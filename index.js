import app from './src/app.js';

//  https://nodejs.org/dist/latest-v14.x/docs/api/process.html#process_process
// env vars we will use
const CAN_CHANNEL =  process.env.CHANNEL
const NODE_ENV = process.env.NODE_ENV

const dashServer = app(CAN_CHANNEL);
// Development or Live (starts webserver if live)
const APP_TYPE = process.env.TYPE || dashServer.TYPES.DEVELOPMENT

process.on('beforeExit', (code) => {
  console.log('Process beforeExit event with code: ', code);
  dashServer.stop();
});
process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});

dashServer.start(APP_TYPE);


