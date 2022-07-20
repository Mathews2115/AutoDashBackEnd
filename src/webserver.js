import express from 'express';
import http from 'http';

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

class DashContentWebServer {
  constructor (frontEndUrl, entryPointName) {
    this.started = false;
    this.entryPointName = entryPointName;
    this.frontEndUrl = frontEndUrl;
    this.webserver = express();
    this.webserver.use(express.static("/home/pi/AutoDashBackEnd/dist")); //  "public" off of current is root
    this.webserver.get('*', function(req, res) {
      res.sendFile('/home/pi/AutoDashBackEnd/dist/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
  }

  start() {
    let port = normalizePort(process.env.PORT || '3000');
    this.webserver.set('port', port);
    this.server = http.createServer(this.webserver);
    this.server.listen(port);
    this.server.on('listening', () => {
      let addr = this.server.address();
      let bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
        console.log('AutoDash: Webserver is listening on ' + bind);
        console.log('AutoDash: !! ----------- WEB-SERVER Ready ----------- !!');
    });
  }

  // stop and cleanup
  stop() {
    this.server.removeAllListeners();
    this.server.close();
    this.server = null;
    console.log("Webserver closed")
  }
}

export default DashContentWebServer;