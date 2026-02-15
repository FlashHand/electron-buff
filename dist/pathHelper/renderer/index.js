'use strict';

var electron = require('electron');

// src/pathHelper/renderer/pathRenderer.helper.ts
var IPC_GET_APP_PATH = "__buff_path_getAppPath__";
var IPC_GET_PATH = "__buff_path_getPath__";
var IPC_GET_USER_DATA_PATH = "__buff_path_getUserDataPath__";
var PathRendererHelper = class {
  /** Get the app installation path */
  async getAppPath() {
    return await electron.ipcRenderer.invoke(IPC_GET_APP_PATH);
  }
  /** Get a special directory or file path by name */
  async getPath(name) {
    return await electron.ipcRenderer.invoke(IPC_GET_PATH, name);
  }
  /** Get the user data path (e.g. Application Support on macOS, Roaming on Windows) */
  async getUserDataPath() {
    return await electron.ipcRenderer.invoke(IPC_GET_USER_DATA_PATH);
  }
};
var pathRendererHelper = new PathRendererHelper();
var exposePathHelper = () => {
  return {
    getAppPath: () => {
      return pathRendererHelper.getAppPath();
    },
    getPath: (name) => {
      return pathRendererHelper.getPath(name);
    },
    getUserDataPath: () => {
      return pathRendererHelper.getUserDataPath();
    }
  };
};

exports.exposePathHelper = exposePathHelper;
exports.pathRendererHelper = pathRendererHelper;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map