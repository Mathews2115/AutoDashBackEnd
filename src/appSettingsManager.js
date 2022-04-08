import fs from 'fs';

const FILE = './settings/appSettings.json'

/**
 * @typedef CarPersistantData
 * @type {object}
 * @property {Number} odometer
 * @property {Number} gallonsLeft
 */

export const appSettingsManager = () => {
  /**
   * Returns data that is saved to file
   * @returns {CarPersistantData}
   */
  const init = () => {
    const data = fs.readFileSync(FILE, {flag: 'r+', encoding: 'utf8'});
    const settings = JSON.parse(data || '{}');

    // @returns {CarPersistantData} - settings
    return settings;
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