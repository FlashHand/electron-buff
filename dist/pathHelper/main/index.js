'use strict';

var electron = require('electron');

// src/pathHelper/main/pathMain.helper.ts
var IPC_GET_APP_PATH = "__buff_path_getAppPath__";
var IPC_GET_PATH = "__buff_path_getPath__";
var IPC_GET_USER_DATA_PATH = "__buff_path_getUserDataPath__";
var PathMainHelper = class {
  init() {
    this.setupListeners();
  }
  setupListeners() {
    electron.ipcMain.handle(IPC_GET_APP_PATH, () => {
      return electron.app.getAppPath();
    });
    electron.ipcMain.handle(IPC_GET_PATH, (_event, name) => {
      return electron.app.getPath(name);
    });
    electron.ipcMain.handle(IPC_GET_USER_DATA_PATH, () => {
      return this.getUserDataPath();
    });
  }
  /** Get the app installation path */
  getAppPath() {
    return electron.app.getAppPath();
  }
  /** Get a special directory or file path by name */
  getPath(name) {
    return electron.app.getPath(name);
  }
  /** Get the user data path (e.g. Application Support on macOS, Roaming on Windows) */
  getUserDataPath() {
    return electron.app.getPath("userData");
  }
};
var pathMainHelper = new PathMainHelper();

exports.pathMainHelper = pathMainHelper;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map