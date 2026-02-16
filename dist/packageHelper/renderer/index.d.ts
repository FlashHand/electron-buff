type PackageInfo = {
    name: string;
    version: string;
    versionCode: number;
    description: string;
    repository: string;
    author: string;
    license: string;
    homepage: string;
};
type PackageHelperApi = {
    getPackageInfo: () => Promise<PackageInfo>;
};

/**
 * Direct reference to window.packageHelper exposed by the preload script.
 * Import this in renderer (browser) code to use packageHelper without manual window casting.
 */
declare const packageHelper: PackageHelperApi;

export { type PackageHelperApi, type PackageInfo, packageHelper };
