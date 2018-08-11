/**
 * @Date:   2018-04-12T01:25:41+02:00
 * @Last modified time: 2018-04-12T20:17:49+02:00
 */

const fs    =   require('fs');
const path  =   require('path');
const debug  =   require('debug')('sockback');
const debugData  =   require('debug')('sockback-data');

module.exports = function mapDirectory(dirPath, node, fn) {
  debug('READDIRRECUR', dirPath);
  debugData(node);
  if (!dirPath) return;
  try {
    debug('STATS');
    const stats = fs.lstatSync(dirPath);
    debugData(stats);
    if (!stats || !stats.isDirectory()) return;
  } catch (e) {
    debugData('Error', e);
    return;
  }
  node.directory = {name: dirPath};
  node.directory.files = [];
  node.directory.childs = [];
  debug('ReaddirSync');
  debugData(node);
  const files = fs.readdirSync(dirPath);
  debugData(files);

  files.forEach((file) => {
    debug('ReaddirSync-file', file);
    const filesPath = path.join(dirPath, file);
    if (fs.lstatSync(filesPath).isDirectory()) {
      debug('isDir', filesPath);
      const child = {parent: node};
      node.directory.childs.push(child);
      const index = node.directory.childs.indexOf(child);
      return mapDirectory(filesPath, node.directory.childs[index], fn);
    }
    debug('isnotDir', filesPath);
    node.directory.files.push(filesPath);
    if (fn) fn(filesPath);
  });
};
