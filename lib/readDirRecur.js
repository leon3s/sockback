/**
 * @Date:   2018-04-12T01:25:41+02:00
 * @Last modified time: 2018-04-12T20:17:49+02:00
 */

const fs    =   require('fs');
const path  =   require('path');

module.exports = function mapDirectory(dirPath, node, fn) {
  if (!dirPath) return;
  try {
    const stats = fs.lstatSync(dirPath);
    if (!stats || !stats.isDirectory()) return;
  } catch(e) {
    return;
  }
  node.directory = {name: dirPath};
  node.directory.files = [];
  node.directory.childs = [];
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filesPath = path.join(dirPath, file);
    if (fs.lstatSync(filesPath).isDirectory()) {
      const child = { parent: node };
      node.directory.childs.push(child);
      const index = node.directory.childs.indexOf(child);
      return mapDirectory(filesPath, node.directory.childs[index], fn);
    }
    node.directory.files.push(filesPath);
    if (fn) fn(filesPath);
  });
};
