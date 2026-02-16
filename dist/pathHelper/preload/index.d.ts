type PathName = 'home' | 'appData' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps';
type PathHelperApi = {
    getAppPath: () => Promise<string>;
    getPath: (name: PathName) => Promise<string>;
    getUserDataPath: () => Promise<string>;
};

/** The pathHelper API instance, usable in preload code */
declare const pathHelper: PathHelperApi;

export { type PathHelperApi, type PathName, pathHelper };
