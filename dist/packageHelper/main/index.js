'use strict';

var electron = require('electron');
var path = require('path');
var promises = require('fs/promises');

// src/packageHelper/main/package.helper.ts
var IPC_GET_PACKAGE_INFO = "__buff_pkg_getPackageInfo__";
var ALLOWED_FIELDS = [
  "name",
  "version",
  "versionCode",
  "description",
  "repository",
  "author",
  "license",
  "homepage"
];
var DEFAULTS = {
  name: "",
  version: "",
  versionCode: 0,
  description: "",
  repository: "",
  author: "",
  license: "",
  homepage: ""
};
var PackageMainHelper = class {
  constructor() {
    this.cached = null;
  }
  pickFields(raw) {
    const result = {};
    for (const key of ALLOWED_FIELDS) {
      result[key] = raw[key] ?? DEFAULTS[key];
    }
    return result;
  }
  /**
   * Read package.json from app.getAppPath(), cache after first read.
   * Returns only the allowed fields.
   */
  async getPackageInfo() {
    if (this.cached) return this.cached;
    const appPath = electron.app.getAppPath();
    const packagePath = path.join(appPath, "package.json");
    const raw = JSON.parse(await promises.readFile(packagePath, "utf-8"));
    this.cached = this.pickFields(raw);
    return this.cached;
  }
  /**
   * Register IPC listener so renderer/preload processes can request package info.
   * Call this in the main process during initialization.
   */
  init() {
    electron.ipcMain.handle(IPC_GET_PACKAGE_INFO, async () => {
      return await this.getPackageInfo();
    });
  }
};
var packageMainHelper = new PackageMainHelper();

exports.packageMainHelper = packageMainHelper;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map