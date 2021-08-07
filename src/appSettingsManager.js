import fs from 'fs';

const FILE = './settings/appSettings.json'

export const appSettingsManager = (settings) => {
  let gallonsLeft = settings.ecu.tank_size; // initial setting for gallons left

  const readPersistantData = () => {
    const data = fs.readFileSync(FILE, {flag: 'r+', encoding: 'utf8'});
    const settings = JSON.parse(data || '{}');
    gallonsLeft = settings.gallonsLeft || gallonsLeft;
  }

  const init = () => {
    readPersistantData();
    return {gallonsLeft: gallonsLeft};
  }

  const saveSettings = (settings) => {
    const data = JSON.stringify(settings, null, 2);
    fs.writeFile(FILE, data, (err) => {
      if (err) throw err;
    });
  }

  return {
    init: init,
    saveSettings: saveSettings
  }
}