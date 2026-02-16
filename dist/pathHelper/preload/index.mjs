import { contextBridge, ipcRenderer } from 'electron';

// src/pathHelper/preload/pathPreload.helper.ts
var IPC_GET_APP_PATH = "__buff_path_getAppPath__";
var IPC_GET_PATH = "__buff_path_getPath__";
var IPC_GET_USER_DATA_PATH = "__buff_path_getUserDataPath__";
var getAppPath = () => {
  return ipcRenderer.invoke(IPC_GET_APP_PATH);
};
var getPath = (name) => {
  return ipcRenderer.invoke(IPC_GET_PATH, name);
};
var getUserDataPath = () => {
  return ipcRenderer.invoke(IPC_GET_USER_DATA_PATH);
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
    contextBridge.exposeInMainWorld("pathHelper", pathHelper);
  } catch (error) {
    console.error("[pathPreload] exposeInMainWorld failed:", error);
  }
} else {
  globalThis.pathHelper = pathHelper;
}

export { pathHelper };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map