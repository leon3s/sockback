'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = mapDirectory;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function mapDirectory(dirPath, node, fn) {
  if (!dirPath) return;
  if (!_fs2.default.lstatSync(dirPath).isDirectory()) return;
  node.directory = { name: dirPath };
  node.directory.files = [];
  node.directory.childs = [];
  var files = _fs2.default.readdirSync(dirPath);

  files.forEach(function (file) {
    var filesPath = _path2.default.join(dirPath, file);
    if (_fs2.default.lstatSync(filesPath).isDirectory()) {
      var child = { parent: node };
      node.directory.childs.push(child);
      var index = node.directory.childs.indexOf(child);
      return mapDirectory(filesPath, node.directory.childs[index], fn);
    }
    node.directory.files.push(filesPath);
    if (fn) fn(filesPath);
  });
};