import { contextBridge, ipcRenderer } from 'electron';

// src/xpc/preload/xpcPreload.helper.ts

// src/xpc/preload/xpc-id.helper.ts
var prefix = Math.random().toString(36).slice(2, 8);
var counter = 0;
var generateXpcId = () => {
  return `r-${prefix}-${(++counter).toString(36)}`;
};

// src/xpc/preload/xpcPreload.helper.ts
var XPC_REGISTER = "__xpc_register__";
var XPC_EXEC = "__xpc_exec__";
var XPC_FINISH = "__xpc_finish__";
var xpcHandlers = /* @__PURE__ */ new Map();
var handle = (handleName, handler) => {
  xpcHandlers.set(handleName, handler);
  ipcRenderer.send(XPC_REGISTER, { handleName });
  ipcRenderer.on(handleName, async (_event, payload) => {
    let ret = null;
    const localHandler = xpcHandlers.get(handleName);
    if (localHandler) {
      try {
        ret = await localHandler(payload);
      } catch (_e) {
        ret = null;
      }
    }
    ipcRenderer.send(XPC_FINISH, {
      id: payload.id,
      handleName: payload.handleName,
      params: payload.params,
      ret
    });
  });
};
var removeHandle = (handleName) => {
  xpcHandlers.delete(handleName);
  ipcRenderer.removeAllListeners(handleName);
};
var send = async (handleName, params) => {
  const payload = {
    id: generateXpcId(),
    handleName,
    params,
    ret: null
  };
  return await ipcRenderer.invoke(XPC_EXEC, payload);
};
var createXpcRendererApi = () => {
  return {
    handle: (handleName, handler) => {
      handle(handleName, handler);
    },
    removeHandle: (handleName) => {
      removeHandle(handleName);
    },
    send: (handleName, params) => {
      return send(handleName, params);
    }
  };
};
var xpcRenderer = createXpcRendererApi();
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("xpcRenderer", xpcRenderer);
  } catch (error) {
    console.error("[xpcPreload] exposeInMainWorld failed:", error);
  }
} else {
  globalThis.xpcRenderer = xpcRenderer;
}

export { xpcHandlers, xpcRenderer };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map