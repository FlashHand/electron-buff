# XPC — 跨进程通信

XPC 是面向 **electron-vite** 项目的跨进程通信模块。支持渲染进程之间（通过主进程中转）的异步消息传递，以及主进程到渲染进程的直接通信。

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
```

## 导出

### `electron-buff/xpc/main`

| 导出 | 类型 | 说明 |
|------|------|------|
| `xpcCenter` | `XpcCenter` | 单例中心。导入即注册所有 IPC 监听器。 |
| `xpcMain` | `XpcMain` | 从主进程向指定渲染窗口发送消息。 |
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

### 5. 从主进程发送到渲染进程

```ts
import { xpcMain } from 'electron-buff/xpc/main';

const result = await xpcMain.sendToRenderer(browserWindow, 'my/channel', { foo: 'bar' });
```

### 6. 移除处理器

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
