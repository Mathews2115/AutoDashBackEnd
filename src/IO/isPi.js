import os from 'os';

export default () => {
  return os.arch().includes('arm') && os.platform() === 'linux';
}