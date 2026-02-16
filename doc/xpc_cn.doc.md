# XPC — 跨进程通信

XPC 是面向 **Electron** 应用的双向异步 RPC 模块。不同于 Electron 内置的 `ipcRenderer.invoke` / `ipcMain.handle` 仅支持渲染进程到主进程的请求-响应模式，XPC 允许**任意进程**（渲染进程或主进程）以完整的 `async/await` 语义调用**任意其他进程**中注册的处理器——包括渲染进程间、主进程到渲染进程、以及主进程内部的调用。

## 优点

1. **将工作分配到渲染进程** — 可以将耗时或阻塞性任务委托给隐藏窗口的渲染进程中的 preload 脚本执行，保持主进程的响应性，降低主进程的性能开销。
2. **任意进程间统一的 async/await 语义** — 由于所有跨进程调用均支持 `async/await`，跨多个进程的复杂多步作业流程可以用简洁的顺序逻辑编排，无需深层嵌套回调或手动事件协调。

## 用法 A：硬编码 send / handle

这是底层 API，需要手动指定通道名称字符串。

### 1. 初始化 XPC Center（Main Layer）

```ts
// src/main/index.ts
import { xpcCenter } from 'electron-buff/xpc/main';

xpcCenter.init();
```

### 2. Main Layer 中注册与发送

```ts
import { xpcMain } from 'electron-buff/xpc/main';

// 注册处理器
xpcMain.handle('my/mainChannel', async (payload) => {
  console.log('主进程收到:', payload.params);
  return { message: '来自主进程的问候' };
});

// 发送到任意已注册的处理器（主进程或渲染进程）
const result = await xpcMain.send('my/channel', { foo: 'bar' });
```

### 3. Preload Layer 中注册与发送

```ts
// Preload 脚本 — 可直接访问 electron
import { xpcRenderer } from 'electron-buff/xpc/preload';

// 注册处理器
xpcRenderer.handle('my/channel', async (payload) => {
  console.log('收到参数:', payload.params);
  return { message: '来自 preload 的问候' };
});

// 发送到其他处理器
const result = await xpcRenderer.send('other/channel', { foo: 'bar' });
```

### 4. Web Layer 中注册与发送

```ts
// 网页 — 无 electron 访问，使用 window.xpcRenderer
import { xpcRenderer } from 'electron-buff/xpc/renderer';

// 注册处理器
xpcRenderer.handle('my/webChannel', async (payload) => {
  return { message: '来自网页的问候' };
});

// 发送到其他处理器
const result = await xpcRenderer.send('my/channel', { foo: 'bar' });
```

### 5. 移除处理器

```ts
xpcRenderer.removeHandle('my/channel');
```

---

## 用法 B：Handler / Emitter 模式（推荐）

Handler/Emitter 模式提供**类型安全**、**自动注册**的通道，基于类名和方法名自动生成通道名称，无需硬编码字符串。

通道命名规则：`xpc:类名/方法名`

> **⚠️ 重要提示：Handler 方法最多只能接受 1 个参数。** 由于 `send()` 只能携带一个 `params` 值，不支持多参数方法。类型系统会强制执行此约束——拥有 2 个及以上参数的方法在 Emitter 类型中会被映射为 `never`，导致编译错误。

### Main Layer

```ts
import { XpcMainHandler, createXpcMainEmitter } from 'electron-buff/xpc/main';

// --- 定义 Handler ---
class UserService extends XpcMainHandler {
  // ✅ 0 个参数 — 合法
  async getCount(): Promise<number> {
    return 42;
  }

  // ✅ 1 个参数 — 合法
  async getUserList(params: { page: number }): Promise<any[]> {
    return db.query('SELECT * FROM users LIMIT ?', [params.page]);
  }

  // ❌ 2+ 个参数 — 在 Emitter 侧会产生编译错误
  // async search(keyword: string, page: number): Promise<any> { ... }
}

// 实例化 — 自动注册：
//   xpc:UserService/getCount
//   xpc:UserService/getUserList
const userService = new UserService();
```

```ts
// --- 使用 Emitter（可在任意层级使用）---
import { createXpcMainEmitter } from 'electron-buff/xpc/main';
import type { UserService } from './somewhere';

const userEmitter = createXpcMainEmitter<UserService>('UserService');

const count = await userEmitter.getCount();           // 发送到 xpc:UserService/getCount
const list = await userEmitter.getUserList({ page: 1 }); // 发送到 xpc:UserService/getUserList
```

### Preload Layer

```ts
import { XpcPreloadHandler, createXpcPreloadEmitter } from 'electron-buff/xpc/preload';

// --- 定义 Handler ---
class MessageTable extends XpcPreloadHandler {
  async getMessageList(params: { chatId: string }): Promise<any[]> {
    return sqlite.query('SELECT * FROM messages WHERE chatId = ?', [params.chatId]);
  }
}

// 实例化 — 自动注册：xpc:MessageTable/getMessageList
const messageTable = new MessageTable();
```

```ts
// --- 使用 Emitter（可在其他 preload 或 web 层级使用）---
import { createXpcPreloadEmitter } from 'electron-buff/xpc/preload';
import type { MessageTable } from './somewhere';

const messageEmitter = createXpcPreloadEmitter<MessageTable>('MessageTable');
const messages = await messageEmitter.getMessageList({ chatId: '123' });
```

### Web Layer

```ts
import { XpcRendererHandler, createXpcRendererEmitter } from 'electron-buff/xpc/renderer';

// --- 定义 Handler ---
class UINotification extends XpcRendererHandler {
  async showToast(params: { text: string }): Promise<void> {
    toast.show(params.text);
  }
}

const uiNotification = new UINotification();
```

```ts
// --- 使用 Emitter（可在其他层级使用）---
import { createXpcRendererEmitter } from 'electron-buff/xpc/renderer';
import type { UINotification } from './somewhere';

const notifyEmitter = createXpcRendererEmitter<UINotification>('UINotification');
await notifyEmitter.showToast({ text: 'Hello!' });
```

### 跨层级 Emitter 调用

Emitter 不限于与 Handler 在同一层级使用。你可以在**任意层级**创建 Emitter 来调用**任意其他层级**的 Handler，只要底层的 `send()` 可用即可：

```ts
// 在 Web Layer 中调用 Preload Layer 的 Handler：
import { createXpcRendererEmitter } from 'electron-buff/xpc/renderer';
import type { MessageTable } from './somewhere';

const messageEmitter = createXpcRendererEmitter<MessageTable>('MessageTable');
const messages = await messageEmitter.getMessageList({ chatId: '123' });

// 在 Main Layer 中调用 Preload Layer 的 Handler：
import { createXpcMainEmitter } from 'electron-buff/xpc/main';
import type { MessageTable } from './somewhere';

const messageEmitter = createXpcMainEmitter<MessageTable>('MessageTable');
const messages = await messageEmitter.getMessageList({ chatId: '123' });
```

---

## 依赖

- **electron** `>=20.0.0`
- **rig-foundation** `>=1.0.0`（提供 `Semaphore`）

## 进程层级

XPC 将 Electron 应用中的进程分为三个层级：

| 层级 | 运行环境 | 导入路径 |
|------|----------|----------|
| **Main Layer（主进程层）** | Node.js 主进程 | `electron-buff/xpc/main` |
| **Preload Layer（预加载层）** | 渲染进程的 preload 脚本（可访问 `electron`） | `electron-buff/xpc/preload` |
| **Web Layer（网页层）** | 渲染进程的网页（无 `electron` 访问，通过 `window.xpcRenderer`） | `electron-buff/xpc/renderer` |

## 架构

```
Preload A / Web A               主进程                  Preload B / Web B
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
| `xpcCenter` | `XpcCenter` | 单例中心。调用 `xpcCenter.init()` 注册所有 IPC 监听器。 |
| `xpcMain` | `XpcMain` | 在主进程中注册处理器，并向任意已注册的处理器发送消息。 |
| `XpcMainHandler` | `class` | 基于 Proxy 自动注册的 Handler 基类。 |
| `createXpcMainEmitter` | `function` | 为 Handler 类创建类型安全的 Emitter 代理。 |
| `XpcTask` | `class` | 内部任务封装，基于信号量阻塞。 |
| `XpcPayload` | `type` | `{ id, handleName, params?, ret? }` — 可序列化的 IPC 载荷。 |
| `XpcEmitterOf` | `type` | 将 Handler 类方法映射为 Emitter 方法签名的工具类型。 |

### `electron-buff/xpc/preload`

| 导出 | 类型 | 说明 |
|------|------|------|
| `xpcRenderer` | `XpcRendererApi` | 在 preload 中注册处理器和发送消息。自动通过 `contextBridge` 暴露到 `window.xpcRenderer`。 |
| `XpcPreloadHandler` | `class` | 基于 Proxy 自动注册的 Handler 基类。 |
| `createXpcPreloadEmitter` | `function` | 为 Handler 类创建类型安全的 Emitter 代理。 |
| `XpcRendererApi` | `type` | xpcRenderer API 的类型定义。 |
| `XpcPayload` | `type` | 载荷类型（重新导出）。 |
| `XpcEmitterOf` | `type` | 将 Handler 类方法映射为 Emitter 方法签名的工具类型。 |

### `electron-buff/xpc/renderer`

| 导出 | 类型 | 说明 |
|------|------|------|
| `xpcRenderer` | `XpcRendererApi` | 引用 preload 暴露的 `window.xpcRenderer`。 |
| `XpcRendererHandler` | `class` | 基于 Proxy 自动注册的 Handler 基类。 |
| `createXpcRendererEmitter` | `function` | 为 Handler 类创建类型安全的 Emitter 代理。 |
| `XpcRendererApi` | `type` | xpcRenderer API 的类型定义。 |
| `XpcPayload` | `type` | 载荷类型（重新导出）。 |
| `XpcEmitterOf` | `type` | 将 Handler 类方法映射为 Emitter 方法签名的工具类型。 |

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

// 将 Handler 类方法映射为 Emitter 兼容的签名。
// 2+ 参数的方法会被映射为 `never`（编译错误）。
type XpcEmitterOf<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]:
    /* 0 或 1 个参数 → 保留；2+ 个参数 → never */
};
```
