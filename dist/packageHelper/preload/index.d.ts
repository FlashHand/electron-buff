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

/** The packageHelper API instance, usable in preload code */
declare const packageHelper: PackageHelperApi;

export { type PackageHelperApi, type PackageInfo, packageHelper };
