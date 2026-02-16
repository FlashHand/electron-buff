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

declare class PackageMainHelper {
    private cached;
    private pickFields;
    /**
     * Read package.json from app.getAppPath(), cache after first read.
     * Returns only the allowed fields.
     */
    getPackageInfo(): Promise<PackageInfo>;
    /**
     * Register IPC listener so renderer/preload processes can request package info.
     * Call this in the main process during initialization.
     */
    init(): void;
}
declare const packageMainHelper: PackageMainHelper;

export { type PackageHelperApi, type PackageInfo, packageMainHelper };
