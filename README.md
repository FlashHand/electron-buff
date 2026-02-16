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

### XPC — **Async/Await** Style Cross-Process Communication

XPC is a bidirectional **async/await** RPC module for **Electron** applications. Unlike Electron's built-in `ipcRenderer.invoke` / `ipcMain.handle`, which only supports renderer-to-main request–response, XPC enables **any process** (renderer or main) to call handlers registered in **any other process** with full `async/await` semantics — including renderer-to-renderer, main-to-renderer, and main-to-main invocations.

**Advantages:**

1. **Offload work to renderer processes** — Heavy or blocking tasks can be delegated to a preload script running in a hidden renderer window, keeping the main process responsive and reducing its performance overhead.
2. **Unified async/await across all processes** — Since every inter-process call supports `async/await`, complex multi-step workflows that span multiple processes can be orchestrated with straightforward sequential logic, eliminating deeply nested callbacks or manual event coordination.

> Full documentation: [English](./doc/xpc.doc.md) | [中文](./doc/xpc_cn.doc.md)

## 模块概览

### XPC — **Async/Await** 风格的跨进程通信

XPC 是面向 **Electron** 应用的双向异步 RPC 模块。不同于 Electron 内置的 `ipcRenderer.invoke` / `ipcMain.handle` 仅支持渲染进程到主进程的请求-响应模式，XPC 允许**任意进程**（渲染进程或主进程）以完整的 `async/await` 语义调用**任意其他进程**中注册的处理器——包括渲染进程间、主进程到渲染进程、以及主进程内部的调用。

**优点：**

1. **将工作分配到渲染进程** — 可以将耗时或阻塞性任务委托到渲染进程中执行，保持主进程的响应性，降低主进程的性能开销。
2. **任意进程间统一的 async/await 语义** — 由于所有跨进程调用均支持 `async/await`，跨多个进程的复杂多步作业流程可以用简洁的顺序逻辑编排，无需深层嵌套回调或手动事件协调。

> 完整文档：[English](./doc/xpc.doc.md) | [中文](./doc/xpc_cn.doc.md)

## License

MIT
