'use strict';

var electron = require('electron');

// src/pathHelper/preload/pathPreload.helper.ts
var IPC_GET_APP_PATH = "__buff_path_getAppPath__";
var IPC_GET_PATH = "__buff_path_getPath__";
var IPC_GET_USER_DATA_PATH = "__buff_path_getUserDataPath__";
var getAppPath = () => {
  return electron.ipcRenderer.invoke(IPC_GET_APP_PATH);
};
var getPath = (name) => {
  return electron.ipcRenderer.invoke(IPC_GET_PATH, name);
};
var getUserDataPath = () => {
  return electron.ipcRenderer.invoke(IPC_GET_USER_DATA_PATH);
};
var createPathHelperApi = () => {
  return {
    getAppPath: () => {
      return getAppPath();
    },
    getPath: (name) => {
      return getPath(name);
    },
    getUserDataPath: () => {
      return getUserDataPath();
    }
  };
};
var pathHelper = createPathHelperApi();
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("pathHelper", pathHelper);
  } catch (error) {
    console.error("[pathPreload] exposeInMainWorld failed:", error);
  }
} else {
  globalThis.pathHelper = pathHelper;
}

exports.pathHelper = pathHelper;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map