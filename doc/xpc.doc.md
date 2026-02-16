# XPC — Cross-Process Communication

XPC is a bidirectional async/await RPC module for **Electron** applications. Unlike Electron's built-in `ipcRenderer.invoke` / `ipcMain.handle`, which only supports renderer-to-main request–response, XPC enables **any process** (renderer or main) to call handlers registered in **any other process** with full `async/await` semantics — including renderer-to-renderer, main-to-renderer, and main-to-main invocations.

## Advantages

1. **Offload work to renderer processes** — Heavy or blocking tasks can be delegated to renderer processes, keeping the main process responsive and reducing its performance overhead.
2. **Unified async/await across all processes** — Since every inter-process call supports `async/await`, complex multi-step workflows that span multiple processes can be orchestrated with straightforward sequential logic, eliminating deeply nested callbacks or manual event coordination.

## Usage A: Hard-coded send / handle

This is the low-level API where you manually specify channel names as strings.

### 1. Initialize XPC Center (Main Layer)

```ts
// src/main/index.ts
import { xpcCenter } from 'electron-buff/xpc/main';

xpcCenter.init();
```

### 2. Register & Send in Main Layer

```ts
import { xpcMain } from 'electron-buff/xpc/main';

// Register a handler
xpcMain.handle('my/mainChannel', async (payload) => {
  console.log('Received in main:', payload.params);
  return { message: 'Hello from main process' };
});

// Send to any registered handler (main or renderer)
const result = await xpcMain.send('my/channel', { foo: 'bar' });
```

### 3. Register & Send in Preload Layer

```ts
// Preload script — has direct electron access
import { xpcRenderer } from 'electron-buff/xpc/preload';

// Register a handler
xpcRenderer.handle('my/channel', async (payload) => {
  console.log('Received params:', payload.params);
  return { message: 'Hello from preload' };
});

// Send to another handler
const result = await xpcRenderer.send('other/channel', { foo: 'bar' });
```

### 4. Register & Send in Web Layer

```ts
// Web page — no electron access, uses window.xpcRenderer
import { xpcRenderer } from 'electron-buff/xpc/renderer';

// Register a handler
xpcRenderer.handle('my/webChannel', async (payload) => {
  return { message: 'Hello from web' };
});

// Send to another handler
const result = await xpcRenderer.send('my/channel', { foo: 'bar' });
```

### 5. Remove a Handler

```ts
xpcRenderer.removeHandle('my/channel');
```

---

## Usage B: Handler / Emitter Pattern (Recommended)

The Handler/Emitter pattern provides **type-safe**, **auto-registered** channels based on class name and method name. No more hard-coded channel strings.

Channel naming convention: `xpc:ClassName/methodName`

> **⚠️ IMPORTANT: Handler methods must accept at most 1 parameter.** Since `send()` can only carry a single `params` value, multi-parameter methods are not supported. The type system enforces this — methods with 2+ parameters will be mapped to `never` in the emitter type, causing a compile error.

### Main Layer

```ts
import { XpcMainHandler, createXpcMainEmitter } from 'electron-buff/xpc/main';

// --- Define a handler ---
class UserService extends XpcMainHandler {
  // ✅ 0 params — OK
  async getCount(): Promise<number> {
    return 42;
  }

  // ✅ 1 param — OK
  async getUserList(params: { page: number }): Promise<any[]> {
    return db.query('SELECT * FROM users LIMIT ?', [params.page]);
  }

  // ❌ 2+ params — will cause compile error on emitter side
  // async search(keyword: string, page: number): Promise<any> { ... }
}

// Instantiate — auto-registers:
//   xpc:UserService/getCount
//   xpc:UserService/getUserList
const userService = new UserService();
```

```ts
// --- Use the emitter (from any layer) ---
import { createXpcMainEmitter } from 'electron-buff/xpc/main';
import type { UserService } from './somewhere';

const userEmitter = createXpcMainEmitter<UserService>('UserService');

const count = await userEmitter.getCount();           // sends to xpc:UserService/getCount
const list = await userEmitter.getUserList({ page: 1 }); // sends to xpc:UserService/getUserList
```

### Preload Layer

```ts
import { XpcPreloadHandler, createXpcPreloadEmitter } from 'electron-buff/xpc/preload';

// --- Define a handler ---
class MessageTable extends XpcPreloadHandler {
  async getMessageList(params: { chatId: string }): Promise<any[]> {
    return sqlite.query('SELECT * FROM messages WHERE chatId = ?', [params.chatId]);
  }
}

// Instantiate — auto-registers: xpc:MessageTable/getMessageList
const messageTable = new MessageTable();
```

```ts
// --- Use the emitter (from another preload or web layer) ---
import { createXpcPreloadEmitter } from 'electron-buff/xpc/preload';
import type { MessageTable } from './somewhere';

const messageEmitter = createXpcPreloadEmitter<MessageTable>('MessageTable');
const messages = await messageEmitter.getMessageList({ chatId: '123' });
```

### Web Layer

```ts
import { XpcRendererHandler, createXpcRendererEmitter } from 'electron-buff/xpc/renderer';

// --- Define a handler ---
class UINotification extends XpcRendererHandler {
  async showToast(params: { text: string }): Promise<void> {
    toast.show(params.text);
  }
}

const uiNotification = new UINotification();
```

```ts
// --- Use the emitter (from another layer) ---
import { createXpcRendererEmitter } from 'electron-buff/xpc/renderer';
import type { UINotification } from './somewhere';

const notifyEmitter = createXpcRendererEmitter<UINotification>('UINotification');
await notifyEmitter.showToast({ text: 'Hello!' });
```

### Cross-Layer Emitter Usage

Emitters are not restricted to the same layer as the handler. You can create an emitter in **any layer** to call a handler in **any other layer**, as long as the underlying `send()` is available:

```ts
// In Web Layer, calling a Preload Layer handler:
import { createXpcRendererEmitter } from 'electron-buff/xpc/renderer';
import type { MessageTable } from './somewhere';

const messageEmitter = createXpcRendererEmitter<MessageTable>('MessageTable');
const messages = await messageEmitter.getMessageList({ chatId: '123' });

// In Main Layer, calling a Preload Layer handler:
import { createXpcMainEmitter } from 'electron-buff/xpc/main';
import type { MessageTable } from './somewhere';

const messageEmitter = createXpcMainEmitter<MessageTable>('MessageTable');
const messages = await messageEmitter.getMessageList({ chatId: '123' });
```

---

## Dependencies

- **electron** `>=20.0.0`
- **rig-foundation** `>=1.0.0` (provides `Semaphore`)

## Process Layers

XPC distinguishes three process layers in an Electron app:

| Layer | Environment | Import Path |
|-------|-------------|-------------|
| **Main Layer** | Node.js main process | `electron-buff/xpc/main` |
| **Preload Layer** | Renderer preload script (has `electron` access) | `electron-buff/xpc/preload` |
| **Web Layer** | Renderer web page (no `electron` access, uses `window.xpcRenderer`) | `electron-buff/xpc/renderer` |

## Architecture

```
Preload A / Web A             Main Process              Preload B / Web B
    |                              |                              |
    |  handle(name, handler) ----> |                              |
    |  __xpc_register__            |                              |
    |                              |   <---- send(name, params)   |
    |                              |         __xpc_exec__         |
    |   <---- forward(name) ----   |                              |
    |         execute handler      |                              |
    |   ---- __xpc_finish__ ---->  |                              |
    |                              |   ----> return result        |

Main Process (xpcMain)
    |                              |
    |  handle(name, handler)       |  -- register in xpcCenter registry (id=0)
    |  send(name, params) -------> |  -- delegates to xpcCenter.exec()
    |                              |     if id=0: call local handler directly
    |                              |     else: forward to renderer, block until finish
```

## Exports

### `electron-buff/xpc/main`

| Export | Type | Description |
|--------|------|-------------|
| `xpcCenter` | `XpcCenter` | Singleton hub. Call `xpcCenter.init()` to register all IPC listeners. |
| `xpcMain` | `XpcMain` | Register handlers in main process and send messages to any registered handler. |
| `XpcMainHandler` | `class` | Base class for Proxy-based auto-registered handlers. |
| `createXpcMainEmitter` | `function` | Create a type-safe emitter proxy for a handler class. |
| `XpcTask` | `class` | Internal task wrapper with semaphore-based blocking. |
| `XpcPayload` | `type` | `{ id, handleName, params?, ret? }` — serializable IPC payload. |
| `XpcEmitterOf` | `type` | Utility type that maps a handler class to emitter method signatures. |

### `electron-buff/xpc/preload`

| Export | Type | Description |
|--------|------|-------------|
| `xpcRenderer` | `XpcRendererApi` | Register handlers and send messages from preload. Auto-exposed to `window.xpcRenderer` via `contextBridge`. |
| `XpcPreloadHandler` | `class` | Base class for Proxy-based auto-registered handlers. |
| `createXpcPreloadEmitter` | `function` | Create a type-safe emitter proxy for a handler class. |
| `XpcRendererApi` | `type` | Type definition for the xpcRenderer API. |
| `XpcPayload` | `type` | Same payload type re-exported. |
| `XpcEmitterOf` | `type` | Utility type that maps a handler class to emitter method signatures. |

### `electron-buff/xpc/renderer`

| Export | Type | Description |
|--------|------|-------------|
| `xpcRenderer` | `XpcRendererApi` | Reference to `window.xpcRenderer` exposed by preload. |
| `XpcRendererHandler` | `class` | Base class for Proxy-based auto-registered handlers. |
| `createXpcRendererEmitter` | `function` | Create a type-safe emitter proxy for a handler class. |
| `XpcRendererApi` | `type` | Type definition for the xpcRenderer API. |
| `XpcPayload` | `type` | Same payload type re-exported. |
| `XpcEmitterOf` | `type` | Utility type that maps a handler class to emitter method signatures. |

## IPC Channels (Internal)

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `__xpc_register__` | renderer → main | Register a handleName |
| `__xpc_exec__` | renderer → main | Invoke a remote handler (blocks until finish) |
| `__xpc_finish__` | renderer → main | Signal execution complete, carry return value |
| `{handleName}` | main → renderer | Forward payload to target renderer |

## Type Reference

```ts
type XpcPayload = {
  id: string;        // Unique task ID
  handleName: string; // Event handle name
  params?: any;       // Parameters (nullable)
  ret?: any;          // Return data (nullable)
};

type XpcRendererApi = {
  handle: (handleName: string, handler: (payload: XpcPayload) => Promise<any>) => void;
  removeHandle: (handleName: string) => void;
  send: (handleName: string, params?: any) => Promise<any>;
};

// Maps handler class methods to emitter-compatible signatures.
// Methods with 2+ params are mapped to `never` (compile error).
type XpcEmitterOf<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]:
    /* 0 or 1 param → preserved; 2+ params → never */
};
```
