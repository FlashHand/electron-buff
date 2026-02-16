'use strict';

var electron = require('electron');

// src/packageHelper/preload/packagePreload.helper.ts
var IPC_GET_PACKAGE_INFO = "__buff_pkg_getPackageInfo__";
var getPackageInfo = () => {
  return electron.ipcRenderer.invoke(IPC_GET_PACKAGE_INFO);
};
var createPackageHelperApi = () => {
  return {
    getPackageInfo: () => {
      return getPackageInfo();
    }
  };
};
var packageHelper = createPackageHelperApi();
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("packageHelper", packageHelper);
  } catch (error) {
    console.error("[packagePreload] exposeInMainWorld failed:", error);
  }
} else {
  globalThis.packageHelper = packageHelper;
}

exports.packageHelper = packageHelper;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map