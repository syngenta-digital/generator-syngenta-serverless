const { assert } = require('chai');
const path = require('path');
require('chai').should();
const mock = require('../mock/data');
const { addPackage, addScript, create: create_package_json, read_me, delete_me } = require('../../helpers/package-json');

const base_temp_path = `${path.join(__dirname, '../../')}/temp`;

describe('Test Package Json Helper', async () => {
  describe('#create', () => {
    it('create', () => {
      return new Promise(async resolve => {
        await delete_me();
        await create_package_json(`test-remove`);
        resolve();
      })
    });
    describe('#addScripts', () => {
      it('add Scripts Array', () => {
        return new Promise(async resolve => {

            const scripts = [
                {
                    name: 'start',
                    value: 'concurrently "docker-compose -f aws/local/neo4j.yml up -d" "serverless offline start --stage local --aws_envs local --profile local --region us-east-2"'
                },
                {
                    name: 'version',
                    value: "serverless invoke local --function v1-console-database-versioner --stage local --aws_envs local --region us-east-2"
                }
            ]
        
            await addScript(scripts);
            const packagejson = await read_me();
            assert(Object.keys(packagejson.scripts).length, 6);
            resolve();
        });
      });
      it('add Scripts single', () => {
        return new Promise(async resolve => {

            const script =
            {
                name: 'test2',
                value: 'concurrently "docker-compose -f aws/local/neo4j.yml up -d" "serverless offline start --stage local --aws_envs local --profile local --region us-east-2"'
            }
        
            await addScript(script);
            const packagejson = await read_me();
            assert(Object.keys(packagejson.scripts).length, 7);
            resolve();
        });
      });
    });
    describe('#addPackages', () => {
        it('add packages Array', () => {
          return new Promise(async resolve => {
              const packages = [
                    {
                        name: 'test-npm-package',
                        version: '1.5.4',
                        isDev: true
                    },
                    {
                        name: 'test-npm-package2'
                    },
                    {
                        name: 'test-npm-package3',
                        version: '1.5.6'
                    }
              ]
          
              await addPackage(packages);
              const packagejson = await read_me();
              assert(packagejson.devDependencies['test-npm-package'], '1.5.4');
              assert(packagejson.dependencies['test-npm-package2'], '*');
              assert(packagejson.dependencies['test-npm-package3'], '1.5.6');
              resolve();
          });
        });
        it('add packages single', () => {
          return new Promise(async resolve => {

                const package =
                {
                    name: 'test-npm-package',
                    version: '1.5.4'
                }
          
                await addPackage(package);
                const packagejson = await read_me();
                assert(packagejson.dependencies['test-npm-package'], '1.5.4');
                resolve();
          });
        });
      });
      describe('#cleanup', () => {
        it('remove', () => {
            return new Promise(async resolve => {
                await delete_me();
                resolve();
            });
          });
      })
  });
});