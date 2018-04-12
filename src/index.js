/**
 * @Author: leone <leone>
 * @Date:   2018-01-30T22:40:49+01:00
 * @Filename: index.js
 * @Last modified by:   Leone
 * @Last modified time: 2018-04-12T06:04:01+02:00
 */

import fs from 'fs';
import path from 'path';
import Socknet from 'socknet';
import loopback from 'loopback';
import boot from 'loopback-boot';

import sync from './utils/sync';
import readDirRecur from './utils/readDirRecur';
import generateCRUD from './utils/generateCRUD';

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
      require(filePath)(this);
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
          require(filePath)(model);
        });
      };
    });
  }

  _mountNamespaces() {
    const namespacesDirectory = path.join(this._directory, './namespaces');
    const rootNamespaceDirectory = path.join(namespacesDirectory, './root');

    sync(this.socknet);
    generateCRUD(this.socknet);
    if (!fs.lstatSync(namespacesDirectory).isDirectory())
      return console.error(`Warning: ${namespacesDirectory} not found.`);
    if (!fs.lstatSync(rootNamespaceDirectory).isDirectory())
      return console.error(`Warning: ${rootNamespaceDirectory} not found.`);
    readDirRecur(rootNamespaceDirectory, {}, (filePath) => {
      if (filePath.search('.js')) {
        require(filePath)(this.socknet);
      }
    });
    Object.keys(this.socknet.namespaces).forEach((key) => {
      const namespace = this.socknet.namespaces[key];
      const namespaceDirectory = path.join(namespacesDirectory, namespace.name);

      sync(namespace);
      generateCRUD(namespace);
      this._linkDeps(namespace);
      readDirRecur(namespaceDirectory, {}, (filePath) => {
        require(filePath)(namespace);
      });
    });
  }

  listen() {
    this.socknet = Socknet(this.server.start(this.server));
    this._linkDeps(this.socknet);
    this._initNamespaces();
    this._mountNamespaces();
    this._mountObservers();
    this.socknet.listen();
  }
}

export default function(...args) {
  return new Sockback(...args);
}
