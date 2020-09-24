const mysql_import = require('mysql-import');
const fs = require('fs');
const path = require('path');
const connection = require('./connection');

const _mysqlUriParser = (uri) => {
  const parts = uri.split(':');
  const user = parts[1].split('//')[1];
  const hostpass = parts[2].split('@');
  const pass = hostpass[0];
  const host = hostpass[1];
  const db = parts[3].split('/')[1];
  const params = {
    host,
    user,
    password: pass,
    database: db
  };
  return params;
};

const _getAppConnection = async (params) => {
  const mysql = await _mysqlUriParser(params.versionAppURI);
  const importer = mysql_import.config(mysql);
  return Promise.resolve(importer);
};

const _swap = (arr, i, j) => {
  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
};

const _sortFiles = (arr) => {
  for (let i = 0; i < arr.length; i += 1) {
    for (let j = 1; j < arr.length; j += 1) {
      const prev = arr[j - 1].split('.sql')[0];
      const next = arr[j].split('.sql')[0];
      if (parseInt(prev, 10) > parseInt(next, 10)) {
        _swap(arr, j - 1, j);
      }
    }
  }
  return arr;
};

const apply = async (params) => {
  console.log('APPLYING VERSIONS');
  const versions = await connection.connect(params.versionURI);
  const results = await versions('SELECT * FROM Versions');
  const completed = Array.from(results, (version) => version.version_file);
  const importer = await _getAppConnection(params);
  const dir = path.join(process.cwd(), params.versionsDirectory);
  const files = _sortFiles(await fs.readdirSync(dir));
  for (const file of files) {
    if (completed.indexOf(file) === -1) {
      const filePath = path.join(process.cwd(), params.versionsDirectory, file);
      console.log(`VERSION APPLICATOR APPLYING: ${filePath}`);
      await importer.import(filePath);
      await versions(`INSERT INTO Versions SET version_file = '${file}'`);
      console.log(`VERSION APPLICATOR APPLIED: ${filePath}`);
    } else {
      console.log(`VERSION APPLICATOR SKIPPED: ${file}`);
    }
  }
  return Promise.resolve(true);
};

module.exports = {apply};
