import express from 'express';
import path from 'path';
class DashContentWebServer {
  constructor (frontEndUrl, entryPointName) {
    this.started = false;
    this.entryPointName = entryPointName;
    this.frontEndUrl = frontEndUrl;
    this.webserver = express();
    this.webserver.use(express.static(path.join('', this.frontEndUrl))); //  "public" off of current is root
  }

  start() {
    this.started = true;
    // immediately serve up the main content (who cares about the path)
    this.webserver.get('*', (_req, res) => {
      res.sendFile(path.join('', `${this.frontEndUrl}/${this.entryPointName}` ));
    });
  }

  // stop and cleanup
  stop() {
    if (this.started) {
      this.webserver.stop();
    }
  }
}

export default DashContentWebServer;