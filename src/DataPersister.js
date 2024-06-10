import fs from 'fs';

const SAVE_INTERVAL = 10000;// save interval - when to persist data

class DataPersister {
  /**
   * @param {fs.PathLike} fileLocation
   */
  constructor(fileLocation) {
    this.fileLocation = fileLocation;
    this.intervalId = null;
    this.fd = null;
  }

  read() {
    return JSON.parse(fs.readFileSync(this.fileLocation, { flag: 'r', encoding: 'utf8' }));
  }


  start(data) {
    this.intervalId = setInterval(() => this.save(data), SAVE_INTERVAL);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  save(settings) {
    if (this.fd !== null) {
      const data = JSON.stringify(settings, null, 2);
      // update the file with new settings
      fs.writeFileSync(this.fileLocation, data, { flag: 'w+', encoding: 'utf8' });
    }
  }
}

export default DataPersister;
