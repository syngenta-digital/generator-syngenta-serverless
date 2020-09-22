const { assert } = require('chai');
const path = require('path');
require('chai').should();
const mock = require('../mock/data');
const file = require('../../helpers/file');

const base_temp_path = `${path.join(__dirname, '../../')}/temp`;

describe('Test File Helper', async () => {
  describe('#file', () => {
    it('create_directory', () => {
      return new Promise(async resolve => {
        await file.create_directory(`${base_temp_path}`);
        resolve();
      })
    });
    describe('write_file', () => {
      it('write file', () => {
        return new Promise(async resolve => {
          await file.write_file(`${base_temp_path}/test1.json`, JSON.stringify(mock.properties.serverless_json, null, 4));
          const does_exist = await file.path_exists(`${base_temp_path}/test1.json`);
          assert(does_exist.toString(), 'true');
          resolve();
        });
      });
      it('write yaml', () => {
        return new Promise(async resolve => {
          await file.write_yaml(`${base_temp_path}/test1.yml`, JSON.stringify(mock.properties.serverless_json, null, 4));
          const does_exist = await file.path_exists(`${base_temp_path}/test1.yml`);
          assert(does_exist.toString(), 'true');
          resolve();
        });
      });
      it('read yaml', () => {
        return new Promise(async resolve => {
          const read_yaml = await file.read_yaml(`${base_temp_path}/test1.yml`);
          const _json = JSON.parse(read_yaml);
          assert(_json.app, 'override_me');
          assert(_json.service, 'override_me');
          resolve();
        });
      });
      it('file exists', () => {
        return new Promise(async resolve => {
          const does_exist = await file.path_exists(`${base_temp_path}/test1.yml`);
          assert(does_exist.toString(), 'true');
          resolve();
        });
      })
      it('delete file', () => {
        return new Promise(async resolve => {
          const does_exist = await file.path_exists(`${base_temp_path}/test1.yml`);
          assert(does_exist.toString(), 'true');
          await file.delete_file(`${base_temp_path}/test1.yml`);
          await file.delete_file(`${base_temp_path}/test1.json`);
          resolve();
        });
      });
      it('delete driectory', () => {
        return new Promise(async resolve => {
          await file.force_delete_directory(`${base_temp_path}`);
          resolve();
        });
      });
    })
  });
});