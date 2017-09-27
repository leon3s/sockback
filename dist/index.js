'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function () {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return new (Function.prototype.bind.apply(Sockback, [null].concat(args)))();
};

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _socknet = require('socknet');

var _socknet2 = _interopRequireDefault(_socknet);

var _loopback = require('loopback');

var _loopback2 = _interopRequireDefault(_loopback);

var _loopbackBoot2 = require('loopback-boot');

var _loopbackBoot3 = _interopRequireDefault(_loopbackBoot2);

var _sync = require('./utils/sync');

var _sync2 = _interopRequireDefault(_sync);

var _readDirRecur = require('./utils/readDirRecur');

var _readDirRecur2 = _interopRequireDefault(_readDirRecur);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sockback = function () {
  function Sockback(directory) {
    _classCallCheck(this, Sockback);

    /**
    * @desc Directory where the server is running
    */
    this._directory = directory;
  }

  _createClass(Sockback, [{
    key: '_linkDeps',
    value: function _linkDeps(namespace) {
      namespace.models = this.server.models;
      namespace.settings = this.server.settings;
      namespace.datasources = this.server.datasources;
    }
  }, {
    key: '_loopbackBoot',
    value: function _loopbackBoot(fnInit) {
      /**
      * @desc Loopback boot
      */
      this.server = (0, _loopback2.default)();
      this.server.start = fnInit;
      this.server.sockback = this;

      (0, _loopbackBoot3.default)(this.server, this._directory);
      this._linkDeps(this);
    }
  }, {
    key: 'configure',
    value: function configure(fnInit) {
      this._loopbackBoot(fnInit);
      this._mountModelUtils();
    }
  }, {
    key: '_initNamespaces',
    value: function _initNamespaces() {
      var _this = this;

      this.settings.namespaces.forEach(function (namespace) {
        _this.socknet.createNamespace(namespace);
      });
    }
  }, {
    key: '_mountObservers',
    value: function _mountObservers() {
      var _this2 = this;

      var observersDir = _path2.default.join(this._directory, './observers');
      if (!_fs2.default.lstatSync(observersDir).isDirectory()) return;

      (0, _readDirRecur2.default)(observersDir, {}, function (filePath) {
        require(filePath).default(_this2);
      });
    }
  }, {
    key: '_mountModelUtils',
    value: function _mountModelUtils() {
      var _this3 = this;

      var modelUtilsDir = _path2.default.join(this._directory, './models');
      if (!_fs2.default.lstatSync(modelUtilsDir).isDirectory()) return;
      var files = _fs2.default.readdirSync(modelUtilsDir);

      files.forEach(function (file) {
        var filePath = _path2.default.join(modelUtilsDir, file);
        if (!_fs2.default.lstatSync(filePath).isDirectory()) return;
        var modelName = file.charAt(0).toUpperCase() + file.slice(1);
        if (_this3.server.models[modelName]) {
          var model = _this3.server.models[modelName];
          (0, _readDirRecur2.default)(filePath, {}, function (filePath) {
            require(filePath).default(model);
          });
        };
      });
    }
  }, {
    key: '_mountNamespaces',
    value: function _mountNamespaces() {
      var _this4 = this;

      var namespacesDirectory = _path2.default.join(this._directory, './namespaces');
      var rootNamespaceDirectory = _path2.default.join(namespacesDirectory, './root');

      this.socknet.app = this;
      if (!_fs2.default.lstatSync(namespacesDirectory).isDirectory()) return console.error('Warning: ' + namespacesDirectory + ' not found.');
      if (!_fs2.default.lstatSync(rootNamespaceDirectory).isDirectory()) return console.error('Warning: ' + rootNamespaceDirectory + ' not found.');
      (0, _readDirRecur2.default)(rootNamespaceDirectory, {}, function (filePath) {
        if (filePath.search('.js')) {
          require(filePath).default(_this4.socknet);
        }
      });
      (0, _sync2.default)(this.socknet);
      Object.keys(this.socknet.namespaces).forEach(function (key) {
        var namespace = _this4.socknet.namespaces[key];
        var namespaceDirectory = _path2.default.join(namespacesDirectory, namespace.name);

        _this4._linkDeps(namespace);
        namespace.app = _this4;
        (0, _readDirRecur2.default)(namespaceDirectory, {}, function (filePath) {
          require(filePath).default(namespace);
        });
        (0, _sync2.default)(namespace);
      });
    }
  }, {
    key: 'listen',
    value: function listen() {
      this.socknet = (0, _socknet2.default)(this.server.start(this.server));
      this._linkDeps(this.socknet);
      this._initNamespaces();
      this._mountNamespaces();
      this._mountObservers();
      this.socknet.listen();
    }
  }]);

  return Sockback;
}();