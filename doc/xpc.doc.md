# XPC — Cross-Process Communication

XPC is a bidirectional async/await RPC module for **Electron** applications. Unlike Electron's built-in `ipcRenderer.invoke` / `ipcMain.handle`, which only supports renderer-to-main request–response, XPC enables **any process** (renderer or main) to call handlers registered in **any other process** with full `async/await` semantics — including renderer-to-renderer, main-to-renderer, and main-to-main invocations.

## Advantages

1. **Offload work to renderer processes** — Heavy or blocking tasks can be delegated to a preload script running in a hidden renderer window, keeping the main process responsive and reducing its performance overhead.
2. **Unified async/await across all processes** — Since every inter-process call supports `async/await`, complex multi-step workflows that span multiple processes can be orchestrated with straightforward sequential logic, eliminating deeply nested callbacks or manual event coordination.

## Installation

```ts
// Main process
import { xpcCenter, xpcMain } from 'electron-buff/xpc/main';

// Preload script
import { xpcRenderer, exposeXpcRenderer } from 'electron-buff/xpc/preload';
```

## Dependencies

- **electron** `>=20.0.0`
- **rig-foundation** `>=1.0.0` (provides `Semaphore`)

## Architecture

```
Renderer A                    Main Process                   Renderer B
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
| `xpcCenter` | `XpcCenter` | Singleton hub. Importing it registers all IPC listeners. |
| `xpcMain` | `XpcMain` | Register handlers in main process and send messages to any registered handler (main or renderer). |
| `XpcTask` | `class` | Internal task wrapper with semaphore-based blocking. |
| `XpcPayload` | `type` | `{ id, handleName, params?, ret? }` — serializable IPC payload. |

### `electron-buff/xpc/preload`

| Export | Type | Description |
|--------|------|-------------|
| `xpcRenderer` | `XpcRenderer` | Register handlers and send messages from renderer. |
| `exposeXpcRenderer()` | `() => XpcRendererApi` | Returns a `contextBridge`-safe object. |
| `XpcRendererApi` | `type` | Type definition for the exposed API. |
| `XpcPayload` | `type` | Same payload type re-exported for renderer usage. |

## Usage

### 1. Initialize XPC Center (Main Process)

```ts
// src/main/index.ts
import { xpcCenter } from 'electron-buff/xpc/main';

xpcCenter.init();
```

### 2. Expose in Preload Script

```ts
// src/preload/index.ts
import { contextBridge } from 'electron';
import { exposeXpcRenderer } from 'electron-buff/xpc/preload';

contextBridge.exposeInMainWorld('xpcRenderer', exposeXpcRenderer());
```

### 3. Register a Handler (Renderer A)

```ts
import type { XpcRendererApi, XpcPayload } from 'electron-buff/xpc/preload';

const xpcRenderer = (window as any).xpcRenderer as XpcRendererApi;

xpcRenderer.handle('my/channel', async (payload: XpcPayload) => {
  console.log('Received params:', payload.params);
  return { message: 'Hello from Renderer A' };
});
```

### 4. Send a Message (Renderer B)

```ts
const xpcRenderer = (window as any).xpcRenderer as XpcRendererApi;

const result = await xpcRenderer.send('my/channel', { foo: 'bar' });
console.log(result); // { message: 'Hello from Renderer A' }
```

### 5. Register a Handler in Main Process

```ts
import { xpcMain } from 'electron-buff/xpc/main';

xpcMain.handle('my/mainChannel', async (payload) => {
  console.log('Received in main:', payload.params);
  return { message: 'Hello from main process' };
});
```

### 6. Send from Main Process

```ts
import { xpcMain } from 'electron-buff/xpc/main';

// Send to a renderer-registered handler
const result = await xpcMain.send('my/channel', { foo: 'bar' });

// Send to a main-process-registered handler (calls directly, no IPC)
const result2 = await xpcMain.send('my/mainChannel', { foo: 'bar' });
```

### 7. Remove a Handler

```ts
xpcRenderer.removeHandle('my/channel');
```

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
```
