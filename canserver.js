const expressServer = require('express'),
  server = require('http').createServer(expressServer()),
  appio = require('socket.io')(server),
  can = require('socketcan'),
  exec = require('child_process').exec;

var timer_id = null,
  sockets = new Set(), // for standard data FRAME packets and status packet
  db = Array(10000), // (4 bytes * 100 = reserved space) a mini-db that contains all of our current CAN data, key is CAN-ID, value is binary data
  keys = new Set(), // this Set indicates what messages we've received this "frame".  This is cleared once we've sent the data up to the client.
  channel = null,
  canError = null;

appio.on('connection', socket => {
  serverLogger.add(`${socket} connected`);
  sockets.add(socket);

  socket.on('update_server', (data) => {
    try {
      channel.send({
        id: data.id,
        data: data.data,
        ext: false,
        rtr: false,
      });
      canError = '';
      serverLogger.add(`tx ${data.data}`);
    } catch (error) {
      canError = error.toString();
      serverLogger.add(error.toString());
    }
  });

  // can-dumper support
  socket.on('start dumping', (data) => canDumper.start());
  socket.on('stop dumping', (data) => canDumper.stop());
  socket.on('disconnect', (socket) => {
    serverLogger.add(`${socket} disconnected`);
    sockets.delete(socket);
  });
});


// SEND THE FRAME-PACKET (BINARY)
// [[ID:uint16],[DATA_LENGTH:uint8],[DATA:uint8 * DATA_LENGTH]]
//
// Only send data to app every "frame"
// DO HARD WORK / PROCESSING HERE and let chromium on Pi only worry about one msg per frame and updating to the screen
// Doing this instead of hitting the app with each CAN packet put me back up to 45-60fps from 12fps
setInterval(() => {
  // data we will be sending up - it will be combined into a single packet
  let buffers = [];

  // total length of packet
  framePacketLength = 0;

  keys.forEach((key, value, set) => {
    const buf = Buffer.allocUnsafe(3 + Buffer.byteLength(db[key]));

    // can ID
    buf.writeUInt16BE(key, 0);

    // can length
    buf.writeUInt8(Buffer.byteLength(db[key]), 2);

    // copy can data
    db[key].copy(buf, 3, 0);


    buffers.push(buf);
    framePacketLength += buf.length;
  })

  if (framePacketLength) {
    let packet = Buffer.concat(buffers, framePacketLength);
    // send frame packet to anyone connected with us
    appio.sockets.binary(true).emit('update', packet);
  }

  keys.clear();
}, 16);

/**
 * STATUS PACKET (JSON)
 */
setInterval(() => {
  // send frame packet to anyone connected with us
  appio.sockets.binary(false).emit('status_update', {
    canDumping: canDumper.dumping(),
    logging: logger.logging(),
    streaming: logger.streaming(),
    GPS: false,
    canError: canError,
    serverLog: '' // someday we will send data log stuff up
  });
}, 600);

function shutDown() {
  serverLogger.kill();
  logger.kill();
  channel.stop();
  appio.close(() => {
    server.close(() => {
      console.log('Servers closed.');
      process.exit()
    });
  });
}

process.on('SIGTERM', () =>{
  console.info('Got SIGTERM. Graceful shutdown start');
  serverLogger.add('Got SIGTERM. Graceful shutdown start');
  shutDown();
});

process.on('SIGINT', () => {
  console.info('Got SIGINT. Graceful shutdown start');
  serverLogger.add('Got SIGINT. Graceful shutdown start');
  shutDown();
});

try {
  channel = can.createRawChannel(process.env.CHANNEL, true);
  channel.start();
  // CAN MESSAGE RECEIVED
  // store all messages into mini database - to be sent in one big packet per 'frame'
  // msg: {ts: number, id: number, data: NodeBuffer}
  channel.addListener("onMessage", (msg) => {


  });

  logger.init(appio);
} catch (error) {
  canError = error.toString() + " - Please restart dash interface.";
  serverLogger.add(canError);
}

try {
  server.listen(4000);
} catch (error) {
}

console.log('!! ----------- AutoDash Ready ----------- !!');
// console.log('Socket Server on 4000');

module.exports = appio;
