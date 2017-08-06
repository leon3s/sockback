import fs from 'fs';
import path from 'path';
import Socknet from 'socknet';
import loopback from 'loopback';
import boot from 'loopback-boot';

import sync from './utils/sync';
import readDirRecur from './utils/readDirRecur';

class Sockback {

  constructor(directory) {
    /**
    * @desc Directory where the server is running
    */
    this._directory = directory;
  }

  _linkDeps(namespace) {
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

    boot(this.server, this._directory);
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
    if (!fs.lstatSync(observersDir).isDirectory()) return;

    readDirRecur(observersDir, {}, (filePath) => {
      require(filePath).default(this);
    });
  }

  _mountModelUtils() {
    const modelUtilsDir = path.join(this._directory, './models');
    if (!fs.lstatSync(modelUtilsDir).isDirectory()) return;
    const files = fs.readdirSync(modelUtilsDir);

    files.forEach((file) => {
      const filePath = path.join(modelUtilsDir, file);
      if (!fs.lstatSync(filePath).isDirectory()) return;
      const modelName = file.charAt(0).toUpperCase() + file.slice(1);
      if (this.server.models[modelName]) {
        const model = this.server.models[modelName];
        readDirRecur(filePath, {}, (filePath) => {
          require(filePath).default(model);
        });
      };
    });
  }

  _mountNamespaces() {
    const namespacesDirectory = path.join(this._directory, './namespaces');
    const rootNamespaceDirectory = path.join(namespacesDirectory, './root');

    this.socknet.app = this;
    if (!fs.lstatSync(namespacesDirectory).isDirectory())
      return console.error(`Warning: ${namespacesDirectory} not found.`);
    if (!fs.lstatSync(rootNamespaceDirectory).isDirectory())
      return console.error(`Warning: ${rootNamespaceDirectory} not found.`);
    readDirRecur(rootNamespaceDirectory, {}, (filePath) => {
      if (filePath.search('.js')) {
        require(filePath).default(this.socknet);
      }
    });
    sync(this.socknet);
    Object.keys(this.socknet.namespaces).forEach((key) => {
      const namespace = this.socknet.namespaces[key];
      const namespaceDirectory = path.join(namespacesDirectory, namespace.name);

      this._linkDeps(namespace);
      namespace.app = this;
      readDirRecur(namespaceDirectory, {}, (filePath) => {
        require(filePath).default(namespace);
      });
      sync(namespace);
    });
  }

  listen() {
    this.socknet = Socknet({
      port: this.server.get('port'),
      http: this.server.start(this.server),
    });
    this._linkDeps(this.socknet);
    this._initNamespaces();
    this._mountNamespaces();
    this._mountObservers();
    this.socknet.listen(this.server.get('port'));
  }
}

export default function(...args) {
  return new Sockback(...args);
}
