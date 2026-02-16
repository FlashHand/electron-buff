type PathName = 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps';
type PathHelperApi = {
    getAppPath: () => Promise<string>;
    getPath: (name: PathName) => Promise<string>;
    getUserDataPath: () => Promise<string>;
};

/**
 * Direct reference to window.pathHelper exposed by the preload script.
 * Import this in renderer (browser) code to use pathHelper without manual window casting.
 */
declare const pathHelper: PathHelperApi;

export { type PathHelperApi, type PathName, pathHelper };
