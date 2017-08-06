import fs from 'fs';
import path from 'path';

export default function mapDirectory(dirPath, node, fn) {
  if (!dirPath) return;
  if (!fs.lstatSync(dirPath).isDirectory()) return;
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
