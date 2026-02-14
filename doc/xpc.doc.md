# XPC — Cross-Process Communication

XPC is a cross-process communication module for **electron-vite** projects. It enables seamless async messaging between renderer processes (via the main process as a hub), as well as direct main-to-renderer communication.

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
```

## Exports

### `electron-buff/xpc/main`

| Export | Type | Description |
|--------|------|-------------|
| `xpcCenter` | `XpcCenter` | Singleton hub. Importing it registers all IPC listeners. |
| `xpcMain` | `XpcMain` | Send messages from main to a specific renderer window. |
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

// xpcCenter is a singleton — importing it registers all __xpc__ ipcMain listeners.
void xpcCenter;
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

### 5. Send from Main to Renderer

```ts
import { xpcMain } from 'electron-buff/xpc/main';

const result = await xpcMain.sendToRenderer(browserWindow, 'my/channel', { foo: 'bar' });
```

### 6. Remove a Handler

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
