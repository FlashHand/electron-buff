import { ipcRenderer } from 'electron';
import type { PathName, PathHelperApi } from '../shared/pathHelper.type';

const IPC_GET_APP_PATH = '__buff_path_getAppPath__';
const IPC_GET_PATH = '__buff_path_getPath__';

class PathRendererHelper {
  /** Get the app installation path */
  async getAppPath(): Promise<string> {
    return await ipcRenderer.invoke(IPC_GET_APP_PATH);
  }

  /** Get a special directory or file path by name */
  async getPath(name: PathName): Promise<string> {
    return await ipcRenderer.invoke(IPC_GET_PATH, name);
  }
}

export const pathRendererHelper = new PathRendererHelper();

/**
 * Returns a contextBridge-safe object for exposeInMainWorld.
 * Usage: contextBridge.exposeInMainWorld('pathHelper', exposePathHelper())
 */
export const exposePathHelper = (): PathHelperApi => {
  return {
    getAppPath: (): Promise<string> => {
      return pathRendererHelper.getAppPath();
    },
    getPath: (name: PathName): Promise<string> => {
      return pathRendererHelper.getPath(name);
    },
  };
};
