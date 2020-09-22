const { assert } = require('chai');
const path = require('path');
require('chai').should();
const mock = require('../mock/data');
const file = require('../../helpers/file');
const neo4j = require('../../helpers/neo4j');
const packagejson = require('../../helpers/package-json');
const ServerlessLogic = require('../../logic/serverless');

describe('Test Serverless Generator', () => {
    let _serverless = new ServerlessLogic({});
    before((done) => {

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
          
        describe('#serverless', () => {
            it('create serverless', () => {
                return new Promise(async resolve => {
                    await _serverless.init(
                        mock.properties.app,
                        mock.properties.service
                    )
    
                    resolve();
                })
            });
            describe('serverless was created properly', () => {
                it('app name', () => {
                    const exported = _serverless.export();
                    assert.equal(exported.app, mock.properties.app);
                });
                it('service name', () => {
                    const exported = _serverless.export();
                    assert.equal(exported.service, mock.properties.service);
                });
            })
    
        });
    
        describe('#addFunction', () => {
            it('add apigateway function', () => {
                return new Promise(async resolve => {
                    await _serverless.addFunction({
                        hash_type: 'v1-apigateway-handler',
                        version: mock.properties.version,
                        type: mock.properties.apigateway_type,
                        name: mock.properties.apigateway_name,
                        executor: mock.properties.apigateway_executor,
                        memorySize: mock.properties.apigateway_memorySize,
                        timeout: mock.properties.apigateway_timeout
                    })
    
                    resolve();
                })
            });
            describe('apigateway was created properly', () => {
                it('version', () => {
                    const exported = _serverless.export();
                    assert.equal(exported.functions['v1-apigateway-handler'].name, '${self:provider.stackTags.name}-v1-apigateway-handler');
                });
                it('handler', () => {
                    const exported = _serverless.export();
                    assert.equal(exported.functions['v1-apigateway-handler'].handler, 'application/v1/controller/apigateway/_router.route');
                });
                it('memorySize', () => {
                    const exported = _serverless.export();
                    assert.equal(exported.functions['v1-apigateway-handler'].memorySize, mock.properties.apigateway_memorySize);
                });
                it('timeout', () => {
                    const exported = _serverless.export();
                    assert.equal(exported.functions['v1-apigateway-handler'].timeout, mock.properties.apigateway_timeout);
                });
            })
    
        });
    
        describe('#addIamRole', () => {
            describe('ApiGateway', () => {
                const _path = './aws/iamroles/apigateway.yml';
                it('add apigateway iam role', () => {
                    return new Promise(async resolve => {
                        await _serverless.addIamRole({
                            path: _path,
                            service: 'apigateway'
                        })
                        resolve();
                    })
                });
                describe('iam role was created properly', () => {
                    it('path', () => {
                        const exported = _serverless.export();
                        assert.equal(exported.provider.iamRoleStatements[0], `\${file(${_path})}`);
                    });
                    it('was created in serverless yml', () => {
                        return new Promise(async resolve => {
                            const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`);
                            assert.equal(serverless_yml.provider.iamRoleStatements[0], `\${file(${_path})}`);
                            resolve();
                        })
                    });
                });
            });
            describe('iamroles', () => {
                describe('DynamoDB', () => {
                    const _path = './aws/iamroles/dynamodb.yml';
                    it('add ddb iam role', () => {
                        return new Promise(async resolve => {
                            await _serverless.addIamRole({
                                path: _path,
                                service: 'ddb'
                            })
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            const exported = _serverless.export();
                            assert.equal(exported.provider.iamRoleStatements[1], `\${file(${_path})}`);
                        });
                        it('was created in iamroles directory', () => {
                            return new Promise(async resolve => {
                                const exists = await file.path_exists(`${path.join(__dirname, '../../')}/aws/iamroles/dynamodb.yml`);
                                assert.equal(exists, true);
                                resolve();
                            })
                        });
                        it('was created in serverless yml', () => {
                            return new Promise(async resolve => {
                                const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`);
                                assert.equal(serverless_yml.provider.iamRoleStatements[1], `\${file(${_path})}`);
                                resolve();
                            })
                        });
                    });
                });
                describe('s3', () => {
                    const _path = './aws/iamroles/s3.yml';
                    const bucket_name = 'test';
                    it('add s3 iam role', () => {
                        return new Promise(async resolve => {
                            await _serverless.addIamRole({
                                path: _path,
                                bucket_name,
                                service: 's3'
                            })
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            const exported = _serverless.export();
                            // console.log('logging exported', exported);
                            assert.equal(exported.provider.iamRoleStatements[2], `\${file(${_path})}`);
                        });
                        it('was created in iamroles directory', () => {
                            return new Promise(async resolve => {
                                const exists = await file.path_exists(`${path.join(__dirname, '../../')}/aws/iamroles/s3.yml`);
                                assert.equal(exists, true);
                                resolve();
                            })
                        });
                        it('was created in serverless yml', () => {
                            return new Promise(async resolve => {
                                const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`);
                                assert.equal(serverless_yml.provider.iamRoleStatements[2], `\${file(${_path})}`);
                                resolve();
                            })
                        });
                        it('the value is correct', () => {
                            return new Promise(async resolve => {
                                const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/aws/iamroles/s3.yml`);
                                const { Resource } = serverless_yml;
                                assert(Resource[0], `arn:aws:s3:::\${self:provider.stackTags.name}-${bucket_name}/*`);
                                resolve();
                            })
                        });
                    });
                });
                describe('ssm', () => {
                    const _path = './aws/iamroles/ssm.yml';
                    const api_name = 'test';
                    it('add ssm iam role', () => {
                        return new Promise(async resolve => {
                            await _serverless.addIamRole({
                                path: _path,
                                api_name,
                                service: 'ssm'
                            })
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            const exported = _serverless.export();
                            assert.equal(exported.provider.iamRoleStatements[3], `\${file(${_path})}`);
                        });
                        it('was created in iamroles directory', () => {
                            return new Promise(async resolve => {
                                const exists = await file.path_exists(`${path.join(__dirname, '../../')}/aws/iamroles/ssm.yml`);
                                assert.equal(exists, true);
                                resolve();
                            })
                        });
                        it('was created in serverless yml', () => {
                            return new Promise(async resolve => {
                                const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`);
                                assert.equal(serverless_yml.provider.iamRoleStatements[3], `\${file(${_path})}`);
                                resolve();
                            })
                        });
                        it('the value is correct', async () => {
                            return new Promise(async resolve => {
                                const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/aws/iamroles/ssm.yml`);
                                const { Resource } = serverless_yml;
                                assert(Resource[0], `arn:aws:ssm:\${self:provider.region}:*:parameter/\${self:provider.stage}-${api_name}/*`);
                                resolve();
                            })
                        });
                    });
                });
                describe('sqs', () => {
                    const _path = './aws/iamroles/sqs.yml';
                    it('add sqs iam role', () => {
                        return new Promise(async resolve => {
                            await _serverless.addIamRole({
                                path: _path,
                                service: 'sqs'
                            })
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            const exported = _serverless.export();
                            assert.equal(exported.provider.iamRoleStatements[4], `\${file(${_path})}`);
                        });
                        it('was created in iamroles directory', () => {
                            return new Promise(async resolve => {
                                const exists = await file.path_exists(`${path.join(__dirname, '../../')}/aws/iamroles/sqs.yml`);
                                assert.equal(exists, true);
                                resolve();
                            })
                        });
                        it('was created in serverless yml', () => {
                            return new Promise(async resolve => {
                                const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`);
                                assert.equal(serverless_yml.provider.iamRoleStatements[4], `\${file(${_path})}`);
                                resolve();
                            })
                        });
                    });
                });
                describe('sns', () => {
                    const _path = './aws/iamroles/sns.yml';
                    it('add sns iam role', () => {
                        return new Promise(async resolve => {
                            await _serverless.addIamRole({
                                path: _path,
                                service: 'sns'
                            })
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            const exported = _serverless.export();
                            assert.equal(exported.provider.iamRoleStatements[5], `\${file(${_path})}`);
                        });
                        it('was created in iamroles directory', () => {
                            return new Promise(async resolve => {
                                const exists = await file.path_exists(`${path.join(__dirname, '../../')}/aws/iamroles/sns.yml`);
                                assert.equal(exists, true);
                                resolve();
                            })
                        });
                        it('was created in serverless yml', () => {
                            return new Promise(async resolve => {
                                const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`);
                                assert.equal(serverless_yml.provider.iamRoleStatements[5], `\${file(${_path})}`);
                                resolve();
                            })
                        });
                    });
                });
            });
        });
    
        describe('#Resources', () => {
            describe('#neo4j', () => {
                it('init', () => {
                    return new Promise(async (resolve) => {
                        await neo4j.init();
                        resolve();
                    })
                });
                it('package json is correct', () => {
                    return new Promise(async (resolve) => {
                        const _packagejson = await packagejson.read_me();
                        assert(_packagejson.scripts.start, 'concurrently "docker-compose -f aws/local/neo4j.yml up -d" "serverless offline start --stage local --aws_envs local --profile local --region us-east-2"');
                        assert(_packagejson.scripts.version, 'serverless invoke local --function v1-console-database-versioner --stage local --aws_envs local --region us-east-2');
                        // console.log(_packagejson.dependencies['syngenta-database-versioner'])
                        // assert(_packagejson.dependencies['syngenta-database-versioner'])
                        // correct scripts
                        // correct dependency (syngenta-database-versioner)
                        resolve();
                    })
                });
                it('db_versions folder exists', () => {
                    return new Promise(async (resolve) => {
                        // await neo4j.init();
                        const exists = await file.path_exists(`${path.join(__dirname, '../../')}/db_versions`)
                        assert(exists, true);
                        resolve();
                    })
                });
                it('aws/local/neo4j/yml exists', () => {
                    return new Promise(async (resolve) => {
                        // await neo4j.init();
                        resolve();
                    })
                });
                it('db-versioner function created correctly', () => {
                    return new Promise(async (resolve) => {
                        // await neo4j.init();
                        resolve();
                    })
                });
                it('environment variables are set', () => {
                    return new Promise(async (resolve) => {
                        // await neo4j.init();
                        resolve();
                        done();
                    })
                });
            });
        });

        after(() => {
            it('delete serverless', () => {
                return new Promise(async resolve => {
                    console.log("HIT AFTER FUNCTION!")
                    // TODO: this path stuff is way too confusing need to somehow reference parent dir.
                    await file.delete_file(`${path.join(__dirname, '../../')}/serverless.yml`);
                    await file.delete_file(`${path.join(__dirname, '../../')}/package2.json`);
                    await file.force_delete_directory(`${path.join(__dirname, '../../')}aws`);
                    await file.force_delete_directory(`${path.join(__dirname, '../../')}application`);
                    resolve();
                })
            })
        })
    })
    
});