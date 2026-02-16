# electron-buff

Electron enhancement utilities for electron-vite projects.

## Install

```bash
yarn add electron-buff
```

## Modules

| Module | Description | Documentation |
|--------|-------------|---------------|
| **XPC** | **Async/await** style cross-process communication | [English](./doc/xpc.doc.md) \| [中文](./doc/xpc_cn.doc.md) |


## Module Overview

### XPC — Cross-Process Communication

XPC is a bidirectional **async/await** RPC module for **Electron** applications. Unlike Electron's built-in `ipcRenderer.invoke` / `ipcMain.handle`, which only supports renderer-to-main request–response, XPC enables **any process** (renderer or main) to call handlers registered in **any other process** with full `async/await` semantics — including renderer-to-renderer, main-to-renderer, and main-to-main invocations.

**Advantages:**

1. **Offload work to renderer processes** — Heavy or blocking tasks can be delegated to a preload script running in a hidden renderer window, keeping the main process responsive and reducing its performance overhead.
2. **Unified async/await across all processes** — Since every inter-process call supports `async/await`, complex multi-step workflows that span multiple processes can be orchestrated with straightforward sequential logic, eliminating deeply nested callbacks or manual event coordination.

> Full documentation: [English](./doc/xpc.doc.md) | [中文](./doc/xpc_cn.doc.md)

## License

MIT
