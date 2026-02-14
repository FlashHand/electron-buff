import { app, ipcMain } from 'electron';
import type { PathName } from '../shared/pathHelper.type';

const IPC_GET_APP_PATH = '__buff_path_getAppPath__';
const IPC_GET_PATH = '__buff_path_getPath__';

class PathMainHelper {
  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    ipcMain.handle(IPC_GET_APP_PATH, () => {
      return app.getAppPath();
    });

    ipcMain.handle(IPC_GET_PATH, (_event, name: PathName) => {
      return app.getPath(name);
    });
  }

  /** Get the app installation path */
  getAppPath(): string {
    return app.getAppPath();
  }

  /** Get a special directory or file path by name */
  getPath(name: PathName): string {
    return app.getPath(name);
  }
}

export const pathMainHelper = new PathMainHelper();
