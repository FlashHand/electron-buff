# electron-buff

Electron enhancement utilities for electron-vite projects.

## Modules

| Module | Description | Documentation |
|--------|-------------|---------------|
| **XPC** | **Async/await** style cross-process communication | [English](./doc/xpc.doc.md) \| [中文](./doc/xpc_cn.doc.md) |

## Install

```bash
yarn add electron-buff
```

## TODO

1. 通过 Proxy 实现 XPC 调用：发送通过调用 class 的 function 实现，监听通过 class 的函数名在实例化过程中自动注册，无需手动调用 `handle`/`send` 并传入字符串句柄，可实现代码自动补全。
2. 重复监听处理优化：对同一 handleName 的重复注册进行检测与策略处理（覆盖、警告或抛错）。
3. 多进程广播支持：支持向多个已注册的进程同时广播消息。


## Module Overview

### XPC — Cross-Process Communication

XPC is a bidirectional **async/await** RPC module for **Electron** applications. Unlike Electron's built-in `ipcRenderer.invoke` / `ipcMain.handle`, which only supports renderer-to-main request–response, XPC enables **any process** (renderer or main) to call handlers registered in **any other process** with full `async/await` semantics — including renderer-to-renderer, main-to-renderer, and main-to-main invocations.

**Advantages:**

1. **Offload work to renderer processes** — Heavy or blocking tasks can be delegated to a preload script running in a hidden renderer window, keeping the main process responsive and reducing its performance overhead.
2. **Unified async/await across all processes** — Since every inter-process call supports `async/await`, complex multi-step workflows that span multiple processes can be orchestrated with straightforward sequential logic, eliminating deeply nested callbacks or manual event coordination.

> Full documentation: [English](./doc/xpc.doc.md) | [中文](./doc/xpc_cn.doc.md)

## License

MIT
