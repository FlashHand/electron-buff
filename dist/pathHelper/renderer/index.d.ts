type PathName = 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps';
type PathHelperApi = {
    getAppPath: () => Promise<string>;
    getPath: (name: PathName) => Promise<string>;
    getUserDataPath: () => Promise<string>;
};

declare class PathRendererHelper {
    /** Get the app installation path */
    getAppPath(): Promise<string>;
    /** Get a special directory or file path by name */
    getPath(name: PathName): Promise<string>;
    /** Get the user data path (e.g. Application Support on macOS, Roaming on Windows) */
    getUserDataPath(): Promise<string>;
}
declare const pathRendererHelper: PathRendererHelper;
/**
 * Returns a contextBridge-safe object for exposeInMainWorld.
 * Usage: contextBridge.exposeInMainWorld('pathHelper', exposePathHelper())
 */
declare const exposePathHelper: () => PathHelperApi;

export { type PathHelperApi, type PathName, exposePathHelper, pathRendererHelper };
