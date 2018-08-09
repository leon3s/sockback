/**
 * @Author: leone <leone>
 * @Date:   2018-01-30T22:40:49+01:00
 * @Filename: index.js
 * @Last modified by:
 * @Last modified time: 2018-04-14T01:04:12+02:00
 */

const fs           =    require('fs');
const path         =    require('path');
const Socknet      =    require('socknet');
const loopback     =    require('loopback');
const boot         =    require('loopback-boot');

const sync         =    require('./sync');
const readDirRecur =    require('./readDirRecur');
const generateCRUD =    require('./generateCRUD');

class Sockback {
  constructor(directory) {
    /**
    * @desc Directory where the server is running
    */
    this._directory = directory;
  }

  _linkDeps(namespace) {
    namespace.app = this.server;
    namespace.models = this.server.models;
    namespace.settings = this.server.settings;
    namespace.datasources = this.server.datasources;
  }

  _loopbackBoot(fnInit) {
    /**
    * @desc Loopback boot
    */
    this.server = loopback();
    this.server.start = fnInit;
    this.server.sockback = this;

    boot(this.server, {
      appRootDir: this.directory,
      bootScripts: [path.join(this._directory, 'boot/')],
    });
    this._linkDeps(this);
  }

  configure(fnInit) {
    this._loopbackBoot(fnInit);
    this._mountModelUtils();
  }

  _initNamespaces() {
    this.settings.namespaces.forEach((namespace) => {
      this.socknet.createNamespace(namespace);
    });
  }

  _mountObservers() {
    const observersDir = path.join(this._directory, './observers');
    if (!fs.existsSync(observersDir)) return;
    if (!fs.lstatSync(observersDir).isDirectory()) return;

    readDirRecur(observersDir, {}, (filePath) => {
      if (!filePath.match(/^[^.].*.js$/)) return;
      require(filePath)(this);
    });
  }

  _mountModelUtils() {
    const modelUtilsDir = path.join(this._directory, './models');
    if (!fs.existsSync(modelUtilsDir)) return;
    if (!fs.lstatSync(modelUtilsDir).isDirectory()) return;
    const files = fs.readdirSync(modelUtilsDir);

    files.forEach((file) => {
      const filePath = path.join(modelUtilsDir, file);
      if (!fs.existsSync(filePath)) return;
      if (!fs.lstatSync(filePath).isDirectory()) return;
      const modelName = file.charAt(0).toUpperCase() + file.slice(1);
      if (this.server.models[modelName]) {
        const model = this.server.models[modelName];
        readDirRecur(filePath, {}, (filePath) => {
          if (!filePath.match(/^[^.].*.js$/)) return;
          require(filePath)(model);
        });
      };
    });
  }

  _loadModelsDirectories(namespaceDirectory) {
    this.socknet.app.models().forEach(({ modelName }) => {
      const modelNameLowercased = modelName.charAt(0).toUpperCase() + modelName.slice(1);
      const modelDirectory = path.join(namespaceDirectory, modelNameLowercased);
      readDirRecur(modelDirectory, {}, (filePath) => {
        if (!filePath.match(/^[^.].*.js$/)) return;
        require(filePath)(this.socknet.models[modelName]);
      });
    });
  }

  _mountNamespaces() {
    const namespacesDirectory = path.join(this._directory, './namespaces');
    const rootNamespaceDirectory = path.join(namespacesDirectory, './root');

    sync(this.socknet);
    generateCRUD(this.socknet);
    this._loadModelsDirectories(rootNamespaceDirectory);
    Object.keys(this.socknet.namespaces).forEach((key) => {
      const namespace = this.socknet.namespaces[key];
      const namespaceDirectory = path.join(namespacesDirectory, namespace.name);

      sync(namespace);
      generateCRUD(namespace);
      this._linkDeps(namespace);
      this._loadModelsDirectories(namespaceDirectory);
    });
  }

  enable(callback = () => {}) {
    this._app = this.server.start(this.server);
    this.socknet = Socknet(this._app);
    this._linkDeps(this.socknet);
    this._initNamespaces();
    this._mountNamespaces();
    this._mountObservers();
    this.socknet.listen(callback);
  }
}

module.exports = function(...args) {
  return new Sockback(...args);
};
