'use strict';

var electron = require('electron');
var rigFoundation = require('rig-foundation');

// src/xpc/main/xpc-center.helper.ts
var XpcTask = class {
  constructor(payload) {
    this.id = payload.id;
    this.handleName = payload.handleName;
    this.params = payload.params;
    this.ret = payload.ret ?? null;
    this.semaphore = new rigFoundation.Semaphore(1);
    this.semaphore.take(() => {
    });
  }
  /** Block until unblock() is called */
  block() {
    return this.semaphore.takeAsync();
  }
  /** Release the semaphore, unblocking the waiting block() call */
  unblock() {
    this.semaphore.leave();
  }
  /** Convert to a plain XpcPayload (serializable for IPC) */
  toPayload() {
    return {
      id: this.id,
      handleName: this.handleName,
      params: this.params,
      ret: this.ret
    };
  }
};

// src/xpc/main/xpc-id.helper.ts
var prefix = Math.random().toString(36).slice(2, 8);
var counter = 0;
var generateXpcId = () => {
  return `${prefix}-${(++counter).toString(36)}`;
};
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

// src/xpc/main/xpc-main.helper.ts
var XpcMain = class {
  constructor() {
    this.handlers = /* @__PURE__ */ new Map();
  }
  /**
   * Register a handler in the main process.
   * When another renderer calls send() with this handleName, xpcCenter will
   * invoke this handler directly (webContentsId = 0) without forwarding to a renderer.
   */
  handle(handleName, handler) {
    this.handlers.set(handleName, handler);
    xpcCenter.registerMainHandler(handleName);
  }
  /**
   * Get the registered handler for a given handleName.
   */
  getHandler(handleName) {
    return this.handlers.get(handleName);
  }
  /**
   * Send a message to a registered handler by handleName.
   * Delegates to xpcCenter.exec() which handles both main-process and renderer targets.
   */
  async send(handleName, params) {
    return xpcCenter.exec(handleName, params);
  }
};
var xpcMain = new XpcMain();

// src/xpc/main/xpc-center.helper.ts
var XPC_REGISTER = "__xpc_register__";
var XPC_EXEC = "__xpc_exec__";
var XPC_FINISH = "__xpc_finish__";
var XpcCenter = class {
  constructor() {
    /** handleName → webContentsId */
    this.registry = /* @__PURE__ */ new Map();
    /** task.id → XpcTask (with semaphore block/unblock) */
    this.pendingTasks = /* @__PURE__ */ new Map();
  }
  init() {
    pathMainHelper.init();
    this.setupListeners();
  }
  /**
   * Register a main-process handleName in the registry with webContentsId = 0.
   */
  registerMainHandler(handleName) {
    this.registry.set(handleName, 0);
  }
  /**
   * Execute a handleName: if main-process handler, call directly;
   * otherwise forward to target renderer, block until __xpc_finish__.
   * Used by both ipcMain.handle(XPC_EXEC) and xpcMain.send().
   */
  async exec(handleName, params) {
    const targetId = this.registry.get(handleName);
    if (targetId == null) {
      return null;
    }
    const payload = {
      id: generateXpcId(),
      handleName,
      params
    };
    if (targetId === 0) {
      const handler = xpcMain.getHandler(handleName);
      if (!handler) {
        return null;
      }
      try {
        return await handler(payload);
      } catch (_e) {
        return null;
      }
    }
    const target = electron.webContents.fromId(targetId);
    if (!target || target.isDestroyed() || target.isCrashed()) {
      return null;
    }
    const task = new XpcTask(payload);
    this.pendingTasks.set(task.id, task);
    target.send(handleName, payload);
    await task.block();
    this.pendingTasks.delete(task.id);
    return task.toPayload().ret ?? null;
  }
  setupListeners() {
    electron.ipcMain.on(XPC_REGISTER, (event, payload) => {
      this.registry.set(payload.handleName, event.sender.id);
    });
    electron.ipcMain.handle(XPC_EXEC, async (_event, payload) => {
      return this.exec(payload.handleName, payload.params);
    });
    electron.ipcMain.on(XPC_FINISH, (_event, payload) => {
      const task = this.pendingTasks.get(payload.id);
      if (task) {
        task.ret = payload.ret ?? null;
        task.unblock();
      }
    });
  }
};
var xpcCenter = new XpcCenter();

exports.XpcTask = XpcTask;
exports.xpcCenter = xpcCenter;
exports.xpcMain = xpcMain;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map