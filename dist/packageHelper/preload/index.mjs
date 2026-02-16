import { contextBridge, ipcRenderer } from 'electron';

// src/packageHelper/preload/packagePreload.helper.ts
var IPC_GET_PACKAGE_INFO = "__buff_pkg_getPackageInfo__";
var getPackageInfo = () => {
  return ipcRenderer.invoke(IPC_GET_PACKAGE_INFO);
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
    contextBridge.exposeInMainWorld("packageHelper", packageHelper);
  } catch (error) {
    console.error("[packagePreload] exposeInMainWorld failed:", error);
  }
} else {
  globalThis.packageHelper = packageHelper;
}

export { packageHelper };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map