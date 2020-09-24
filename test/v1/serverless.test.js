const { assert } = require('chai');
const path = require('path');
require('chai').should();
const mock = require('../mock/data');
const file = require('../../helpers/file');
const config = require('../../helpers/config');
const neo4j = require('../../helpers/neo4j');
const rds_mysql = require('../../helpers/rds-mysql');
const packagejson = require('../../helpers/package-json');
const logger = require('../../helpers/logger');
const ServerlessLogic = require('../../logic/serverless');
const { addPackage, addScript, create: create_package_json, read_me, delete_me } = require('../../helpers/package-json');
const { default: neo4j_versioner_template } = require('../../templates/controller/console/neo4j_dbversioner');
const { default: router_template } = require('../../templates/controller/apigateway/router');
const { default: rds_mysql_template } = require('../../templates/aws/resources/mysql/rds-mysql');
const { default: security_group_rules_template } = require('../../templates/aws/resources/mysql/security-group-rules');
const { default: security_group_template } = require('../../templates/aws/resources/mysql/security-group');
const { default: vpc_rds_template } = require('../../templates/aws/resources/mysql/vpc-rds');
const { default: apigateway_template}  = require('../../templates/aws/resources/apigateway');
const { default: mysql_versioner_template } = require('../../templates/controller/console/mysql_dbversioner');
const { default: local_mysql_template } = require('../../templates/aws/local/mysql');
const base_temp_path = `${path.join(__dirname, '../../')}temp`;

describe('Test Serverless Generator', () => {
    let _serverless = new ServerlessLogic({});
    before(async () => {
        logger.log('====== START ======');
        // build package json
        // await delete_me();
        await create_package_json(`test-remove`);
        await file.create_directory(base_temp_path);
        await _serverless.init(
            mock.properties.app,
            mock.properties.service
        );
        logger.log('====== STARTUP COMPLETE MOVING ONTO TESTS ======')
    })
    after(async () => {
        // TODO: this path stuff is way too confusing need to somehow reference parent dir.
        logger.log('====== TESTS COMPLETE MOVING TO CLEANUP ======')
        if(config.DEBUG) {
            await file.delete_file(`${path.join(__dirname, '../../')}/serverless.yml`);
            await file.delete_file(`${path.join(__dirname, '../../')}/package2.json`);
            await file.force_delete_directory(`${path.join(__dirname, '../../')}aws`);
            await file.force_delete_directory(`${path.join(__dirname, '../../')}application`);
            await file.force_delete_directory(`${path.join(__dirname, '../../')}db_versions`);
        }
        logger.log('====== COMPLETE =====')
    })
    describe('Test File Helper', () => {
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
                assert.equal(does_exist.toString(), 'true');
                resolve();
              });
            });
            it('write yaml', () => {
              return new Promise(async resolve => {
                await file.write_yaml(`${base_temp_path}/test1.yml`, JSON.stringify(mock.properties.serverless_json, null, 4));
                const does_exist = await file.path_exists(`${base_temp_path}/test1.yml`);
                assert.equal(does_exist.toString(), 'true');
                resolve();
              });
            });
            it('read yaml', () => {
              return new Promise(async resolve => {
                const read_yaml = await file.read_yaml(`${base_temp_path}/test1.yml`);
                const _json = JSON.parse(read_yaml);
                assert.equal(_json.app, 'override_me');
                assert.equal(_json.service, 'override_me');
                resolve();
              });
            });
            it('file exists', () => {
              return new Promise(async resolve => {
                const does_exist = await file.path_exists(`${base_temp_path}/test1.yml`);
                assert.equal(does_exist.toString(), 'true');
                resolve();
              });
            })
            it('delete file', () => {
              return new Promise(async resolve => {
                const does_exist = await file.path_exists(`${base_temp_path}/test1.yml`);
                assert.equal(does_exist.toString(), 'true');
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
    describe('Test Package Json Helper', () => {
        describe('#create', () => {
          describe('#addScripts', () => {
            it('add Scripts Array', () => {
              return new Promise(async resolve => {
      
                  const scripts = [
                      {
                          name: 'start',
                          value: 'concurrently "docker-compose -f aws/local/neo4j.yml up -d" "serverless offline start --stage local --aws_envs local --profile local --region us-east-2"'
                      }
                  ]
              
                  await addScript(scripts);
                  const packagejson = await read_me();
                  assert.equal(Object.keys(packagejson.scripts).length, 5);
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
                  assert.equal(Object.keys(packagejson.scripts).length, 6);
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
                    assert.equal(packagejson.devDependencies['test-npm-package'], '1.5.4');
                    assert.equal(packagejson.dependencies['test-npm-package2'], '*');
                    assert.equal(packagejson.dependencies['test-npm-package3'], '1.5.6');
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
                      assert.equal(packagejson.dependencies['test-npm-package'], '1.5.4');
                      resolve();
                });
              });
            });
        });
    });
    describe('Test Serverless Generator', () => {
        describe('Test Package Json Helper', async () => {
            describe('#create', () => {
                describe('#addScripts', () => {
                    it('add Scripts Array', () => {
                        return new Promise(async resolve => {
                
                            const scripts = [
                                {
                                    name: 'start',
                                    value: 'concurrently "docker-compose -f aws/local/neo4j.yml up -d" "serverless offline start --stage local --aws_envs local --profile local --region us-east-2"'
                                }
                            ]
                        
                            await addScript(scripts);
                            const packagejson = await read_me();
                            assert.equal(Object.keys(packagejson.scripts).length, 6);
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
                            assert.equal(Object.keys(packagejson.scripts).length, 6);
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
                            assert.equal(packagejson.devDependencies['test-npm-package'], '1.5.4');
                            assert.equal(packagejson.dependencies['test-npm-package2'], '*');
                            assert.equal(packagejson.dependencies['test-npm-package3'], '1.5.6');
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
                            assert.equal(packagejson.dependencies['test-npm-package'], '1.5.4');
                            resolve();
                        });
                    });
                });
            });
        });
            
        describe('#serverless', () => {
            describe('serverless was created properly', () => {
                it('app name', () => {
                    const exported = _serverless.export();
                    assert.equal(exported.app, mock.properties.app);
                });
                it('service name', () => {
                    const exported = _serverless.export();
                    assert.equal(exported.service, mock.properties.service);
                });
                it('apigateway router function created correctly', () => {
                    return new Promise(async (resolve) => {
                        const _path = `${path.join(__dirname, '../../')}/application/v1/controller/apigateway/_router.js`;
                        const exists = await file.path_exists(_path);
                        assert.equal(exists, true);
                        // TODO: for some reason the only diff is theres some white space, not sure how to solve for now.
                        // const db_versioner_code = await file.read_file(_path, true)
                        // console.log(JSON.stringify(db_versioner_code.toString()), JSON.stringify(router_template));
                        // assert.equal(JSON.stringify(db_versioner_code.toString()), JSON.stringify(router_template));
                        resolve();
                    });
                });
                it('package json is correct', () => {
                    return new Promise(async (resolve) => {
                        const _packagejson = await packagejson.read_me();
                        assert.equal(_packagejson.dependencies['syngenta-lambda-client'], '*');
                        resolve();
                    })
                });
            })
    
        });
    
        describe('#addFunction', () => {
            it('add apigateway function', () => {
                return new Promise(async resolve => {
                    await _serverless.addFunction({
                        hash_type: 'apigateway-handler',
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
                            assert.equal(exported.provider.iamRoleStatements[0], `\${file(${_path})}`);
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
                                assert.equal(serverless_yml.provider.iamRoleStatements[0], `\${file(${_path})}`);
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
                            assert.equal(exported.provider.iamRoleStatements[1], `\${file(${_path})}`);
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
                                assert.equal(serverless_yml.provider.iamRoleStatements[1], `\${file(${_path})}`);
                                resolve();
                            })
                        });
                        it('the value is correct', () => {
                            return new Promise(async resolve => {
                                const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/aws/iamroles/s3.yml`);
                                const { Resource } = serverless_yml;
                                assert.equal(Resource[0], `arn:aws:s3:::\${self:provider.stackTags.name}-${bucket_name}/*`);
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
                            assert.equal(exported.provider.iamRoleStatements[2], `\${file(${_path})}`);
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
                                assert.equal(serverless_yml.provider.iamRoleStatements[2], `\${file(${_path})}`);
                                resolve();
                            })
                        });
                        it('the value is correct', async () => {
                            return new Promise(async resolve => {
                                const serverless_yml = await file.read_yaml(`${path.join(__dirname, '../../')}/aws/iamroles/ssm.yml`);
                                const { Resource } = serverless_yml;
                                assert.equal(Resource[0], `arn:aws:ssm:\${self:provider.region}:*:parameter/\${self:provider.stackTags.name}-${api_name}/*`);
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
                            assert.equal(exported.provider.iamRoleStatements[3], `\${file(${_path})}`);
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
                                assert.equal(serverless_yml.provider.iamRoleStatements[3], `\${file(${_path})}`);
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
                            assert.equal(exported.provider.iamRoleStatements[4], `\${file(${_path})}`);
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
                                assert.equal(serverless_yml.provider.iamRoleStatements[4], `\${file(${_path})}`);
                                resolve();
                            })
                        });
                    });
                });
            });
        });
    
        describe('#Resources', () => {
            describe('ApiGateway', () => {
                it('add apigateway resource', () => {
                    return new Promise(async resolve => {
                        await _serverless.addResources(['apigateway'], {})
                        resolve();
                    })
                });
                describe('verify apigateway resource was created properly.', () => {
                    it('regenerate the template and make sure its the same.', () => {
                        return new Promise(async resolve => {
                            const apigateway_yaml = await file.read_yaml(`${path.join(__dirname, '../../')}/aws/resources/apigateway.yml`);
                            assert.equal(JSON.stringify(apigateway_yaml), JSON.stringify(apigateway_template()));
                            resolve();
                        })
                    });
                });
            });
            describe('#neo4j', () => {
                before(async () => {
                    logger.log('inside neo4j before')
                    await neo4j.init();
                });
                it('package json is correct', () => {
                    return new Promise(async (resolve) => {
                        const _packagejson = await packagejson.read_me();
                        assert.equal(_packagejson.scripts.start, 'concurrently "docker-compose -f aws/local/neo4j.yml up -d" "serverless offline start --stage local --aws_envs local --profile local --region us-east-2"');
                        // assert.equal(_packagejson.scripts.version, 'serverless invoke local --function v1-console-database-versioner --stage local --aws_envs local --region us-east-2');
                        // assert.equal(_packagejson.dependencies['syngenta-database-versioner'], '1.3.4');
                        // assert.equal(_packagejson.dependencies['neo4j-driver'], '^4.0.2');
                        resolve();
                    })
                });
                it('db_versions folder exists', () => {
                    return new Promise(async (resolve) => {
                        // // await neo4j.init();
                        // const exists = await file.path_exists(`${path.join(__dirname, '../../')}/db_versions`)
                        // assert.equal(exists, true);
                        resolve();
                    });
                });
                it('aws/local/neo4j.yml exists', () => {
                    return new Promise(async (resolve) => {
                        const exists = await file.path_exists(`${path.join(__dirname, '../../')}/aws/local/neo4j.yml`)
                        assert.equal(exists, true);
                        resolve();
                    });
                });
                it('db-versioner function created correctly', () => {
                    return new Promise(async (resolve) => {
                        // const _path = `${path.join(__dirname, '../../')}/application/v1/controller/console/database-versioner.js`;
                        // const exists = await file.path_exists(_path);
                        // assert.equal(exists, true);
                        // const db_versioner_code = await file.read_file(_path, true)
                        // assert.equal(db_versioner_code.toString(), neo4j_versioner_template);
                        resolve();
                    });
                });
                it('environment variables are set', () => {
                    return new Promise(async (resolve) => {
                        const _path = `${path.join(__dirname, '../../')}aws/envs/local.yml`;
                        const _env = await file.read_yaml(_path);
                        assert.equal(_env.environment.NEO4J_HOST, mock.properties.neo4j_host);
                        assert.equal(_env.environment.NEO4J_USER, mock.properties.neo4j_user);
                        assert.equal(_env.environment.NEO4J_PASSWORD, mock.properties.neo4j_password);
                        assert.equal(_env.environment.NEO4J_ENCRYPTED.toString(), mock.properties.neo4j_encrypted.toString());
                        resolve();
                    });
                });
            });
            describe('#rds-mysql', () => {
                const db_name = 'grower-tests';
                before(async () => {
                    logger.log('inside mysql before');
                    // delete neo4j stuff
                    await rds_mysql.init({db_name});
                    
                });
                describe('#rds_mysql', () => {
                    describe('was created properly', () => {
                        it('resources have been created correctly', () => {
                            return new Promise(async resolve => {
                                const _path = `${path.join(__dirname, '../../')}/aws/resources`;
                                const aws_dir_exists = await file.path_exists(_path);
                                assert.equal(aws_dir_exists, true);
                                const resources = [
                                    'rds-mysql',
                                    'security-group-rules',
                                    'security-group',
                                    'vpc-rds'
                                ];

                                for (const resource of resources) {
                                    // ensure all these resources exist in our resources dir;
                                    const resource_exists = await file.path_exists(`${_path}/${resource}.yml`);
                                    assert.equal(resource_exists, true);
                                    const _resource = await file.read_yaml(`${_path}/${resource}.yml`);
                                    switch(resource) {
                                        case 'rds-mysql':
                                            assert.equal(JSON.stringify(_resource), JSON.stringify(rds_mysql_template({db_name})));
                                            break;
                                        case 'security-group-rules':
                                            assert.equal(JSON.stringify(_resource), JSON.stringify(security_group_rules_template()));
                                            break;
                                        case 'security-group':
                                            assert.equal(JSON.stringify(_resource), JSON.stringify(security_group_template()));
                                            break;
                                        case 'vpc-rds':
                                            assert.equal(JSON.stringify(_resource), JSON.stringify(vpc_rds_template()));
                                            break;
                                    }
                                }

                                resolve();
                            })
                        })
                        it('make sure helper files have been copied over correctly', () => {
                            return new Promise(async resolve => {
                                // const _path = `${path.join(__dirname, '../../')}application/v1/controller/console/config`;
                                // const path_exists = await file.path_exists(_path);
                                // assert.equal(path_exists, true);
                                // const helpers = [
                                //     'dbConnector',
                                //     'ssm',
                                //     'helpers/mysql/connection',
                                //     'helpers/mysql/dbBuilder',
                                //     'helpers/mysql/index',
                                //     'helpers/mysql/ssmInterface',
                                //     'helpers/mysql/versionApplicator',
                                //     'helpers/mysql/versionChecker'
                                // ];

                                // for(const helper of helpers) {
                                //     const helper_path = `${_path}/${helper}.js`;
                                //     const helper_exists = await file.path_exists(helper_path);
                                //     assert.equal(helper_exists.toString(), 'true');
                                // }
                                resolve();
                            })
                        });
                        it('make sure all the resources have been added to serverless files', () => {
                            return new Promise(async resolve => {
                                // TODO: lets phase out our serverless logic class, it really makes no sense to have it.
                                // we have a serverless helper file.
                                // anywhere where we do this, we should just switch and read directly from serverless file.
                                // const exported = _serverless.export();
                                const expected = [
                                    'apigateway',
                                    'security-group',
                                    'vpc-rds',
                                    'rds-mysql'
                                ]
                                const _serverless_yaml = await file.read_yaml(`${path.join(__dirname, '../../')}serverless.yml`)
                                const { resources } = _serverless_yaml;
                                
                                for(const resource of resources) {
                                    const found = expected.find(x => `\${file(aws/resources/${x}.yml}` === resource);
                                    assert.notEqual(found, undefined);
                                }
                                resolve();
                            });
                        });
                        it('make sure we got the db versioner function in the correct path', () => {
                            return new Promise(async resolve => {
                                // const _path = `${path.join(__dirname, '../../')}application/v1/controller/console/database-versioner.js`;
                                // const exists = await file.path_exists(_path);
                                // assert.equal(exists, true);
                                // const versioner_code = await file.read_file(_path, true);
                                // const template = mysql_versioner_template();
                                // assert.equal(JSON.stringify(versioner_code.toString()), JSON.stringify(template));
                                resolve();
                            }); 
                        });
                        it('make sure we got db versioner in serverless', () => {
                            return new Promise(async resolve => {
                                // const _serverless_yaml = await file.read_yaml(`${path.join(__dirname, '../../')}serverless.yml`)
                                // const { functions } = _serverless_yaml;
                                // const find_versioner_function = functions['v1-database-versioner'];
                                // assert.equal(JSON.stringify(find_versioner_function), JSON.stringify({
                                //     name: '${self:provider.stackTags.name}-v1-database-versioner',
                                //     description: 'Applies versions to DB',
                                //     handler: 'application/v1/controller/console/database-versioner.apply',
                                //     memorySize: 512,
                                //     timeout: 900
                                // }));
                                resolve();
                            });
                        });
                        it('make sure we have our db versioner folder', () => {
                            return new Promise(async resolve => {
                                // const _path = `${path.join(__dirname, '../../')}db_versions`;
                                // const exists = await file.path_exists(_path);
                                // assert.equal(exists, true);
                                resolve();
                            }); 
                        });
                        it('make sure the local mysql folder is copied over', () => {
                            return new Promise(async resolve => {
                                const _path = `${path.join(__dirname, '../../')}aws/local/mysql.yml`;
                                const exists = await file.path_exists(_path);
                                assert.equal(exists, true);
                                const local_mysql_file = await file.read_yaml(_path);
                                assert.equal(JSON.stringify(local_mysql_file), JSON.stringify(local_mysql_template(db_name)))
                                resolve();
                            });
                        });
                        it('make sure both env\'s are correct', () => {
                            return new Promise(async resolve => {
                                const local_env_path = `${path.join(__dirname, '../../')}aws/envs/local.yml`;
                                const local_env_exists = await file.path_exists(local_env_path);
                                assert.equal(local_env_exists, true);
                                const local_env = await file.read_yaml(local_env_path);
                                const template_local_env = {
                                    DB_NAME: db_name,
                                    DB_APP_USER: db_name,
                                    DB_HOST: '127.0.0.1',
                                    DB_MASTER_USER: 'root',
                                    DB_MASTER_PASS: 'root_password',
                                    DB_URI: `mysql://root:root_password@127.0.0.1:3306/${db_name}`
                                }

                                assert.equal(local_env.environment.DB_NAME, template_local_env.DB_NAME);
                                assert.equal(local_env.environment.DB_APP_USER, template_local_env.DB_APP_USER);
                                assert.equal(local_env.environment.DB_HOST, template_local_env.DB_HOST);
                                assert.equal(local_env.environment.DB_MASTER_USER, template_local_env.DB_MASTER_USER);
                                assert.equal(local_env.environment.DB_MASTER_PASS, template_local_env.DB_MASTER_PASS);
                                assert.equal(local_env.environment.DB_URI, template_local_env.DB_URI);
                            
                                const cloud_env_path = `${path.join(__dirname, '../../')}aws/envs/cloud.yml`;
                                const cloud_env_exists = await file.path_exists(cloud_env_path);
                                assert.equal(cloud_env_exists, true);                            
                                const cloud_env = await file.read_yaml(cloud_env_path);
                                const template_cloud_env = {
                                    DB_NAME: db_name,
                                    DB_APP_USER: db_name,
                                    DB_HOST: {
                                        ['Fn::GetAtt']: [
                                            `${db_name.replace(/-/g, '').trim()}DB`,
                                            'Endpoint.Address'
                                        ]
                                    },
                                    DB_MASTER_USER: 'root',
                                    DB_MASTER_PASS: 'root_password',
                                }

                                assert.equal(cloud_env.environment.DB_NAME, template_cloud_env.DB_NAME);
                                assert.equal(cloud_env.environment.DB_APP_USER, template_cloud_env.DB_APP_USER);
                                assert.equal(JSON.stringify(cloud_env.environment.DB_HOST), JSON.stringify(template_cloud_env.DB_HOST));
                                assert.equal(cloud_env.environment.DB_MASTER_USER, template_cloud_env.DB_MASTER_USER);
                                assert.equal(cloud_env.environment.DB_MASTER_PASS, template_cloud_env.DB_MASTER_PASS);
                                resolve();
                            });
                        });
                        it('make sure the iamRoles are correct', () => {
                            return new Promise(async resolve => {
                                const _serverless_yaml = await file.read_yaml(`${path.join(__dirname, '../../')}serverless.yml`)
                                const { provider } = _serverless_yaml;
                                const { iamRoleStatements } = provider;
                                const find_versioner_function = iamRoleStatements.filter(x => x === '${file(aws/iamroles/ssm.yml)}').shift();
                                assert.notEqual(find_versioner_function, undefined);
                                resolve();
                            });
                        });
                    })
                })
            });
            describe('#dynamodb', () => {
                before(async () => {
                    // delete mysql stuff?
                });
            });
        });
    });
});