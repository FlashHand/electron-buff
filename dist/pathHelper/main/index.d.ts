type PathName = 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps';
type PathHelperApi = {
    getAppPath: () => Promise<string>;
    getPath: (name: PathName) => Promise<string>;
    getUserDataPath: () => Promise<string>;
};

declare class PathMainHelper {
    init(): void;
    private setupListeners;
    /** Get the app installation path */
    getAppPath(): string;
    /** Get a special directory or file path by name */
    getPath(name: PathName): string;
    /** Get the user data path (e.g. Application Support on macOS, Roaming on Windows) */
    getUserDataPath(): string;
}
declare const pathMainHelper: PathMainHelper;

export { type PathHelperApi, type PathName, pathMainHelper };
