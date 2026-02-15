# XPC — 跨进程通信

XPC 是面向 **Electron** 应用的双向异步 RPC 模块。不同于 Electron 内置的 `ipcRenderer.invoke` / `ipcMain.handle` 仅支持渲染进程到主进程的请求-响应模式，XPC 允许**任意进程**（渲染进程或主进程）以完整的 `async/await` 语义调用**任意其他进程**中注册的处理器——包括渲染进程间、主进程到渲染进程、以及主进程内部的调用。

## 优点

1. **将工作卸载到渲染进程** — 可以将耗时或阻塞性任务委托给隐藏窗口的渲染进程中的 preload 脚本执行，保持主进程的响应性，降低主进程的性能开销。
2. **任意进程间统一的 async/await 语义** — 由于所有跨进程调用均支持 `async/await`，跨多个进程的复杂多步作业流程可以用简洁的顺序逻辑编排，无需深层嵌套回调或手动事件协调。

## 安装

```ts
// 主进程
import { xpcCenter, xpcMain } from 'electron-buff/xpc/main';

// Preload 脚本
import { xpcRenderer, exposeXpcRenderer } from 'electron-buff/xpc/preload';
```

## 依赖

- **electron** `>=20.0.0`
- **rig-foundation** `>=1.0.0`（提供 `Semaphore`）

## 架构

```
渲染进程 A                      主进程                        渲染进程 B
    |                              |                              |
    |  handle(name, handler) ----> |                              |
    |  __xpc_register__            |                              |
    |                              |   <---- send(name, params)   |
    |                              |         __xpc_exec__         |
    |   <---- forward(name) ----   |                              |
    |         执行 handler         |                              |
    |   ---- __xpc_finish__ ---->  |                              |
    |                              |   ----> 返回结果             |

主进程 (xpcMain)
    |                              |
    |  handle(name, handler)       |  -- 注册到 xpcCenter registry (id=0)
    |  send(name, params) -------> |  -- 委托给 xpcCenter.exec()
    |                              |     id=0: 直接调用本地 handler
    |                              |     否则: 转发到渲染进程，阻塞等待完成
```

## 导出

### `electron-buff/xpc/main`

| 导出 | 类型 | 说明 |
|------|------|------|
| `xpcCenter` | `XpcCenter` | 单例中心。导入即注册所有 IPC 监听器。 |
| `xpcMain` | `XpcMain` | 在主进程中注册处理器，并向任意已注册的处理器（主进程或渲染进程）发送消息。 |
| `XpcTask` | `class` | 内部任务封装，基于信号量阻塞。 |
| `XpcPayload` | `type` | `{ id, handleName, params?, ret? }` — 可序列化的 IPC 载荷。 |

### `electron-buff/xpc/preload`

| 导出 | 类型 | 说明 |
|------|------|------|
| `xpcRenderer` | `XpcRenderer` | 在渲染进程中注册处理器和发送消息。 |
| `exposeXpcRenderer()` | `() => XpcRendererApi` | 返回 `contextBridge` 安全对象。 |
| `XpcRendererApi` | `type` | 暴露 API 的类型定义。 |
| `XpcPayload` | `type` | 载荷类型（渲染进程侧重新导出）。 |

## 使用方式

### 1. 初始化 XPC Center（主进程）

```ts
// src/main/index.ts
import { xpcCenter } from 'electron-buff/xpc/main';

// xpcCenter 是单例 — 导入即注册所有 __xpc__ ipcMain 监听器。
void xpcCenter;
```

### 2. 在 Preload 脚本中暴露

```ts
// src/preload/index.ts
import { contextBridge } from 'electron';
import { exposeXpcRenderer } from 'electron-buff/xpc/preload';

contextBridge.exposeInMainWorld('xpcRenderer', exposeXpcRenderer());
```

### 3. 注册处理器（渲染进程 A）

```ts
import type { XpcRendererApi, XpcPayload } from 'electron-buff/xpc/preload';

const xpcRenderer = (window as any).xpcRenderer as XpcRendererApi;

xpcRenderer.handle('my/channel', async (payload: XpcPayload) => {
  console.log('收到参数:', payload.params);
  return { message: '来自渲染进程 A 的问候' };
});
```

### 4. 发送消息（渲染进程 B）

```ts
const xpcRenderer = (window as any).xpcRenderer as XpcRendererApi;

const result = await xpcRenderer.send('my/channel', { foo: 'bar' });
console.log(result); // { message: '来自渲染进程 A 的问候' }
```

### 5. 在主进程中注册处理器

```ts
import { xpcMain } from 'electron-buff/xpc/main';

xpcMain.handle('my/mainChannel', async (payload) => {
  console.log('主进程收到:', payload.params);
  return { message: '来自主进程的问候' };
});
```

### 6. 从主进程发送消息

```ts
import { xpcMain } from 'electron-buff/xpc/main';

// 发送到渲染进程注册的处理器
const result = await xpcMain.send('my/channel', { foo: 'bar' });

// 发送到主进程注册的处理器（直接调用，无需 IPC）
const result2 = await xpcMain.send('my/mainChannel', { foo: 'bar' });
```

### 7. 移除处理器

```ts
xpcRenderer.removeHandle('my/channel');
```

## IPC 通道（内部实现）

| 通道 | 方向 | 用途 |
|------|------|------|
| `__xpc_register__` | 渲染 → 主 | 注册 handleName |
| `__xpc_exec__` | 渲染 → 主 | 调用远程处理器（阻塞直到完成） |
| `__xpc_finish__` | 渲染 → 主 | 通知执行完成，携带返回值 |
| `{handleName}` | 主 → 渲染 | 转发载荷到目标渲染进程 |

## 类型参考

```ts
type XpcPayload = {
  id: string;        // 唯一任务 ID
  handleName: string; // 事件处理名称
  params?: any;       // 参数（可空）
  ret?: any;          // 返回数据（可空）
};

type XpcRendererApi = {
  handle: (handleName: string, handler: (payload: XpcPayload) => Promise<any>) => void;
  removeHandle: (handleName: string) => void;
  send: (handleName: string, params?: any) => Promise<any>;
};
```
