import { ipcMain, app } from 'electron';

// src/pathHelper/main/pathMain.helper.ts
var IPC_GET_APP_PATH = "__buff_path_getAppPath__";
var IPC_GET_PATH = "__buff_path_getPath__";
var IPC_GET_USER_DATA_PATH = "__buff_path_getUserDataPath__";
var PathMainHelper = class {
  init() {
    this.setupListeners();
  }
  setupListeners() {
    ipcMain.handle(IPC_GET_APP_PATH, () => {
      return app.getAppPath();
    });
    ipcMain.handle(IPC_GET_PATH, (_event, name) => {
      return app.getPath(name);
    });
    ipcMain.handle(IPC_GET_USER_DATA_PATH, () => {
      return this.getUserDataPath();
    });
  }
  /** Get the app installation path */
  getAppPath() {
    return app.getAppPath();
  }
  /** Get a special directory or file path by name */
  getPath(name) {
    return app.getPath(name);
  }
  /** Get the user data path (e.g. Application Support on macOS, Roaming on Windows) */
  getUserDataPath() {
    return app.getPath("userData");
  }
};
var pathMainHelper = new PathMainHelper();

export { pathMainHelper };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map