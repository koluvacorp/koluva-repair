'use strict';

const path = require('node:path');
const { fileURLToPath } = require('node:url');

function isTrustedAppFrame(frameUrl, appUrl, platform = process.platform) {
  if (typeof frameUrl !== 'string' || typeof appUrl !== 'string') return false;
  try {
    const frame = new URL(frameUrl);
    const app = new URL(appUrl);
    if (frame.protocol !== 'file:' || app.protocol !== 'file:') return false;
    if (frame.search || frame.hash || app.search || app.hash) return false;

    const framePath = path.resolve(fileURLToPath(frame));
    const appPath = path.resolve(fileURLToPath(app));
    return platform === 'win32'
      ? framePath.toLowerCase() === appPath.toLowerCase()
      : framePath === appPath;
  } catch {
    return false;
  }
}

function isTrustedAppRequest(event, webContents, appUrl, platform = process.platform) {
  return !!event && !!webContents && event.sender === webContents
    && isTrustedAppFrame(event.senderFrame?.url, appUrl, platform);
}

module.exports = { isTrustedAppFrame, isTrustedAppRequest };
