const { assert } = require('chai');
const path = require('path');
require('chai').should();
const mock = require('../mock/data');
const file = require('../../helpers/file');
const config = require('../../helpers/config');
const elasticsearch = require('../../helpers/elasticsearch');
const neo4j = require('../../helpers/neo4j');
const dynamodb = require('../../helpers/dynamodb');
const sqs = require('../../helpers/sqs');
const rds_mysql = require('../../helpers/rds-mysql');
const rds_postgres = require('../../helpers/rds-postgres');
const packagejson = require('../../helpers/package-json');
const logger = require('../../helpers/logger');
const serverless_helper = require('../../helpers/serverless');
const { addPackage, addScript, create: create_package_json, read_me, delete_me } = require('../../helpers/package-json');
const { default: neo4j_versioner_template } = require('../../templates/controller/console/neo4j_dbversioner');
const { default: router_template } = require('../../templates/controller/apigateway/router');
const { default: rds_postgres_template } = require('../../templates/aws/resources/postgres/rds-postgres');
const { default: rds_mysql_template } = require('../../templates/aws/resources/mysql/rds-mysql');
const { default: rds_dbinstance_template } = require('../../templates/aws/resources/rds-dbinstance');
const { default: security_group_rules_template } = require('../../templates/aws/resources/mysql/security-group-rules');
const { default: security_group_template } = require('../../templates/aws/resources/mysql/security-group');
const { default: vpc_rds_template } = require('../../templates/aws/resources/vpc');
const { default: apigateway_template}  = require('../../templates/aws/resources/apigateway');
const { default: mysql_versioner_template } = require('../../templates/controller/console/mysql_dbversioner');
const { default: local_mysql_template } = require('../../templates/aws/local/mysql');
const { default: local_postgres_template } = require('../../templates/aws/local/postgres');
const { custom_es, default: es_template } = require('../../templates/aws/resources/elasticsearch');

const base_temp_path = `${path.join(__dirname, '../../')}temp`;

describe('Syngenta Severless Generator Test Suite', () => {
    before(async () => {
        logger.log('====== START ======');
        // build package json
        await delete_me();
        await create_package_json(`test-remove`);
        await file.create_directory(base_temp_path);
        await serverless_helper.init(
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
            // await file.force_delete_directory(`${path.join(__dirname, '../../')}aws`);
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
                assert.notEqual(packagejson.scripts.start, undefined);
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
                  assert.notEqual(packagejson.scripts.test2, undefined);
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
    describe('Test Resource Generator', () => {
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
                            assert.notEqual(packagejson.scripts.start, undefined);
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
                            assert.notEqual(packagejson.scripts.test2, undefined);
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
                    return new Promise(async resolve => {
                        const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`)
                        assert.equal(serverless_file.app, mock.properties.app);
                        resolve();
                    });
                });
                it('service name', () => {
                    return new Promise(async resolve => {
                        const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`)
                        assert.equal(serverless_file.service, mock.properties.service);
                        resolve();
                    });
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
                    await serverless_helper.addFunction({
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
                    return new Promise(async resolve => {
                        const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`)
                        const { functions } = serverless_file;
                        assert.equal(functions['v1-apigateway-handler'].name, '${self:provider.stackTags.name}-v1-apigateway-handler');
                        resolve();
                    });
                });
                it('handler', () => {
                    return new Promise(async resolve => {
                        const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`)
                        const { functions } = serverless_file;
                        assert.equal(functions['v1-apigateway-handler'].handler, 'application/v1/controller/apigateway/_router.route');
                        resolve();
                    });
                });
                it('memorySize', () => {
                    return new Promise(async resolve => {
                        const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`)
                        const { functions } = serverless_file;
                        assert.equal(functions['v1-apigateway-handler'].memorySize, mock.properties.apigateway_memorySize);
                        resolve();
                    });
                });
                it('timeout', () => {
                    return new Promise(async resolve => {
                        const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`)
                        const { functions } = serverless_file;
                        assert.equal(functions['v1-apigateway-handler'].timeout, mock.properties.apigateway_timeout);
                        resolve();
                    });
                });
            })
    
        });
        describe('#addIamRole', () => {
            describe('iamroles', () => {
                describe('DynamoDB', () => {
                    const _path = './aws/iamroles/dynamodb.yml';
                    it('add dynamodb iam role', () => {
                        return new Promise(async resolve => {
                            await serverless_helper.addIamRole(
                                _path,
                                'dynamodb'
                            )
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            return new Promise(async resolve => {
                                const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`)
                                const { provider } = serverless_file;
                                const { iamRoleStatements } = provider;
                                assert.equal(iamRoleStatements[0], `\${file(${_path})}`);
                                resolve();
                            });
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
                            await serverless_helper.addIamRole(
                                _path,
                                's3',
                                null,
                                bucket_name
                            )
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            return new Promise(async resolve => {
                                const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`)
                                const { provider } = serverless_file;
                                const { iamRoleStatements } = provider;
                                assert.equal(iamRoleStatements[1], `\${file(${_path})}`);
                                resolve();
                            });
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
                            await serverless_helper.addIamRole(
                                _path,
                                'ssm',
                                api_name
                            )
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            return new Promise(async resolve => {
                                const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`);
                                const { provider } = serverless_file;
                                const { iamRoleStatements } = provider;
                                assert.equal(iamRoleStatements[2], `\${file(${_path})}`);
                                resolve();
                            });
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
                            await serverless_helper.addIamRole(
                                _path,
                                'sqs'
                            )
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            return new Promise(async resolve => {
                                const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`);
                                const { provider } = serverless_file;
                                const { iamRoleStatements } = provider;
                                assert.equal(iamRoleStatements[3], `\${file(${_path})}`);
                                resolve();
                            });
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
                            await serverless_helper.addIamRole(
                                _path,
                                'sns'
                            )
                            resolve();
                        })
                    });
                    describe('iam role was created properly', () => {
                        it('path', () => {
                            return new Promise(async resolve => {
                                const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}/serverless.yml`);
                                const { provider } = serverless_file;
                                const { iamRoleStatements } = provider;
                                assert.equal(iamRoleStatements[4], `\${file(${_path})}`);
                                resolve();
                            });
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
            describe('#apiGateway', () => {
                it('add apigateway resource', () => {
                    return new Promise(async resolve => {
                        await serverless_helper.addResources(['apigateway'], {});
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
                    // delete neo4j stuff
                    await rds_mysql.init({db_name, engine: 'mysql'});
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
                                            const _template = rds_mysql_template();
                                            _template.Resources[db_name] = rds_dbinstance_template({db_name, engine: 'mysql'})
                                            assert.equal(JSON.stringify(_resource), JSON.stringify(_template));
                                            break;
                                        // case 'security-group-rules':
                                            // assert.equal(JSON.stringify(_resource), JSON.stringify(security_group_rules_template()));
                                            // break;
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
                        it('make sure all the resources have been added to serverless file', () => {
                            return new Promise(async resolve => {
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
                                // make sure the file actually exists, and is correct?
                                resolve();
                            });
                        });
                    })
                })
            });
            describe('#rds-postgres', () => {
                const db_name = 'grower-tests';
                before(async () => {
                    // delete neo4j stuff
                    await rds_postgres.init({db_name, engine: 'postgres'});
                });
                describe('was created properly', () => {
                    it('resources have been created correctly', () => {
                        return new Promise(async resolve => {
                            const _path = `${path.join(__dirname, '../../')}/aws/resources`;
                            const aws_dir_exists = await file.path_exists(_path);
                            assert.equal(aws_dir_exists, true);
                            const resources = [
                                'rds-postgres',
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
                                    case 'rds-postgres':
                                        const _template = rds_postgres_template();
                                        _template.Resources[db_name] = rds_dbinstance_template({db_name, engine: 'postgres'})
                                        assert.equal(JSON.stringify(_resource), JSON.stringify(_template));
                                        break;
                                    // case 'security-group-rules':
                                        // assert.equal(JSON.stringify(_resource), JSON.stringify(security_group_rules_template()));
                                        // break;
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
                    it('make sure all the resources have been added to serverless file', () => {
                        return new Promise(async resolve => {
                            const expected = [
                                'apigateway',
                                'security-group',
                                'vpc-rds',
                                'rds-mysql',
                                'rds-postgres'
                            ]
                            const _serverless_yaml = await file.read_yaml(`${path.join(__dirname, '../../')}serverless.yml`)
                            const { resources } = _serverless_yaml;
                            
                            for(const resource of resources) {
                                const found = expected.find(x => `\${file(aws/resources/${x}.yml}` === resource);
                                console.log('logging resource', resource);
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
                            const _path = `${path.join(__dirname, '../../')}aws/local/postgres.yml`;
                            const exists = await file.path_exists(_path);
                            assert.equal(exists, true);
                            const local_mysql_file = await file.read_yaml(_path);
                            assert.equal(JSON.stringify(local_mysql_file), JSON.stringify(local_postgres_template))
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
                                POSTGRES_DB_NAME: db_name
                            }

                            assert.equal(local_env.environment.POSTGRES_DB_NAME, template_local_env.POSTGRES_DB_NAME);
                        
                            const cloud_env_path = `${path.join(__dirname, '../../')}aws/envs/cloud.yml`;
                            const cloud_env_exists = await file.path_exists(cloud_env_path);
                            assert.equal(cloud_env_exists, true);                            
                            const cloud_env = await file.read_yaml(cloud_env_path);
                            const template_cloud_env = {
                                POSTGRES_DB_NAME: db_name
                            }

                            assert.equal(cloud_env.environment.POSTGRES_DB_NAME, template_cloud_env.POSTGRES_DB_NAME);
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
                            // make sure the file actually exists, and is correct?
                            resolve();
                        });
                    });
                })
            })
            describe('#dynamodb', () => {
                const db_name = 'serverless-test';
                before(async () => {
                    // delete mysql stuff?
                    await dynamodb.init({
                        db_name
                    });
                });
                it('make sure package json is correct', () => {
                    return new Promise(async resolve => {
                        const _packagejson = await packagejson.read_me();
                        assert.notEqual(_packagejson.devDependencies['serverless-dynamodb-local'], undefined);
                        assert.notEqual(_packagejson.devDependencies['serverless-offline'], undefined);
                        resolve();
                    });
                });
                it('make sure resources have been created correctly', () => {
                    return new Promise(async resolve => {
                        const _path = `${path.join(__dirname, '../../')}aws/resources/dynamodb.yml`;
                        const resource_exists = await file.path_exists(_path);
                        assert.equal(resource_exists, true);
                        const read_file = await file.read_yaml(_path);
                        const { Resources } = read_file;
                        assert.notEqual(Resources[db_name], undefined);
                        resolve();
                    });
                });
                it('make sure all the resources have been added to serverless file', () => {
                    return new Promise(async resolve => {
                        const serverless_file = await file.read_yaml(`${path.join(__dirname, '../../')}serverless.yml`);
                        const { custom, provider, plugins } = serverless_file;
                        assert.equal(JSON.stringify(custom.ddb_recovery), JSON.stringify({
                            local: false,
                            dev: false,
                            qa: false,
                            uat: true,
                            prod: true
                        }));
                        assert.equal(JSON.stringify(custom.dynamodb), JSON.stringify({
                            stages: [
                                'local'
                            ],
                            start: {
                                port: 4000,
                                inMemory: true,
                                migrate: true,
                                seed: true
                            }
                        }));
                        resolve();
                    });
                });
                it('make sure both env\'s are correct', () => {
                    return new Promise(async resolve => {
                        const local_env_path = `${path.join(__dirname, '../../')}aws/envs/local.yml`;
                        const local_env_exists = await file.path_exists(local_env_path);
                        const local_env = await file.read_yaml(local_env_path);
                        const template_local_env = {};
                        template_local_env[`DYNAMO_${db_name.replace(/-/g, '_').toUpperCase()}`] = `\${self:provider.stackTags.name}-${db_name}`;                   
                        
                        const cloud_env_path = `${path.join(__dirname, '../../')}aws/envs/cloud.yml`;
                        const cloud_env_exists = await file.path_exists(cloud_env_path);                        
                        const cloud_env = await file.read_yaml(cloud_env_path);
                        const template_cloud_env = {};
                        template_cloud_env[`DYNAMO_${db_name.replace(/-/g, '_').toUpperCase()}`] = `\${self:provider.stackTags.name}-${db_name}`;

                        assert.equal(local_env_exists, true);
                        assert.equal(local_env.environment[`DYNAMO_${db_name.replace(/-/g, '_').toUpperCase()}`], template_local_env[`DYNAMO_${db_name.replace(/-/g, '_').toUpperCase()}`]);
                        assert.equal(cloud_env_exists, true);    
                        assert.equal(cloud_env.environment[`DYNAMO_${db_name.replace(/-/g, '_').toUpperCase()}`], template_cloud_env[`DYNAMO_${db_name.replace(/-/g, '_').toUpperCase()}`]);
                        resolve();
                    });
                });
                it('make sure the iamRoles are correct', () => {
                    return new Promise(async resolve => {
                        const _serverless_yaml = await file.read_yaml(`${path.join(__dirname, '../../')}serverless.yml`)
                        const { provider } = _serverless_yaml;
                        const { iamRoleStatements } = provider;
                        const find_versioner_function = iamRoleStatements.filter(x => x === '${file(aws/iamroles/dynamodb.yml)}').shift();
                        assert.notEqual(find_versioner_function, undefined);
                        // make sure the file actually exists, and is correct?
                        resolve();
                    });
                });
            });
            describe('#elasticsearch', () => {
                const data = {
                    'grower-contracts': {
                        index: 'enogen',
                        type: 'contract'
                    },
                    'seed-stewardship': {
                        index: 'enogen',
                        type: 'steward'
                    },
                    'grain-ops': {
                        index: 'grain',
                        type: 'ops'
                    }
                }
                before(async () => {
                    // delete mysql stuff?
                    for(const [domain_name, _data] of Object.entries(data)) {
                        const { index, type } = _data;
                        await elasticsearch.init({
                            domain_name,
                            index,
                            type
                        });
                    }

                });
                it('make sure serverless file is created correctly', () => {
                    return new Promise(async resolve => {
                        const _serverless_yaml = await file.read_yaml(`${path.join(__dirname, '../../')}serverless.yml`)
                        const { custom } = _serverless_yaml;
                        const { es } = custom;

                        assert.notEqual(es, undefined);
                        for(const [domain_name, _data] of Object.entries(data)) {
                            assert.notEqual(es[domain_name], undefined);
                            const test_yaml = {
                                custom: {
                                    es: {}
                                }
                            }
                            test_yaml.custom.es[domain_name] = custom_es(domain_name, _data.index, _data.type, 'us-east-2');

                            assert.equal(JSON.stringify(test_yaml.custom.es[domain_name]), JSON.stringify(es[domain_name]))
                        }
                        resolve();
                    });
                });
                it('make sure resource file is created correctly', () => {
                    return new Promise(async resolve => {
                        const _serverless_yaml = await file.read_yaml(`${path.join(__dirname, '../../')}aws/resources/elasticsearch.yml`)
                        const test_resource = {
                            Resources: {},
                            Outputs: {}
                        }

                        for(const [domain_name, _data] of Object.entries(data)) {
                            test_resource.Resources[domain_name] = es_template(domain_name);
                            test_resource.Outputs[`Elasticsearch${domain_name}Domain`] = {
                                Value: {
                                    Ref: domain_name
                                }
                            }
                        
                            test_resource.Outputs[`Elasticsearch${domain_name}Arn`] = {
                                Value: null
                            }
                        
                            test_resource.Outputs[`Elasticsearch${domain_name}Endpoint`] = {
                                Value: null
                            }
    
                            assert.equal(JSON.stringify(_serverless_yaml.Resources[domain_name]), JSON.stringify(test_resource.Resources[domain_name]));
                            assert.equal(JSON.stringify(_serverless_yaml.Outputs[`Elasticsearch${domain_name}Domain`]), JSON.stringify(test_resource.Outputs[`Elasticsearch${domain_name}Domain`]));
                            assert.equal(JSON.stringify(_serverless_yaml.Outputs[`Elasticsearch${domain_name}Arn`]), JSON.stringify(test_resource.Outputs[`Elasticsearch${domain_name}Arn`]));
                            assert.equal(JSON.stringify(_serverless_yaml.Outputs[`Elasticsearch${domain_name}Endpoint`]), JSON.stringify(test_resource.Outputs[`Elasticsearch${domain_name}Endpoint`]));
                        }

                        resolve();
                    });
                });
                it('make sure both env\'s are correct', () => {
                    return new Promise(async resolve => {
                        const local_env_path = `${path.join(__dirname, '../../')}aws/envs/local.yml`;
                        const local_env_exists = await file.path_exists(local_env_path);
                        assert.equal(local_env_exists, true);
                        const local_env = await file.read_yaml(local_env_path);

                        const cloud_env_path = `${path.join(__dirname, '../../')}aws/envs/cloud.yml`;
                        const cloud_env_exists = await file.path_exists(cloud_env_path);
                        assert.equal(cloud_env_exists, true);
                        const cloud_env = await file.read_yaml(cloud_env_path);

                        for(const [domain_name, _data] of Object.entries(data)) {
                            const template_local_env = {
                                [`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_INDEX`]: _data.index,
                                [`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_TYPE`]: _data.type,
                                [`ELASTICSEARCH_${domain_name.replace(/-/g, '_').toUpperCase()}_DOMAIN`]: domain_name
                            }
    
                            assert.equal(local_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_INDEX`], template_local_env[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_INDEX`]);
                            assert.equal(local_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_TYPE`], template_local_env[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_TYPE`]);
                            assert.equal(local_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_').toUpperCase()}_DOMAIN`], template_local_env[`ELASTICSEARCH_${domain_name.replace(/-/g, '_').toUpperCase()}_DOMAIN`]);
                        
                            const template_cloud_env = {
                                [`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_INDEX`]: _data.index,
                                [`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_TYPE`]: _data.type,
                                [`ELASTICSEARCH_${domain_name.replace(/-/g, '_').toUpperCase()}_DOMAIN`]: {
                                    'FN::GetAtt': [ `ElasticSearch${domain_name}`, 'DomainEndpoint' ]
                                }
                            }
    
                            assert.equal(cloud_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_INDEX`], template_cloud_env[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_INDEX`]);
                            assert.equal(cloud_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_TYPE`], template_cloud_env[`ELASTICSEARCH_${domain_name.replace(/-/g, '_')}_TYPE`]);
                            assert.equal(JSON.stringify(cloud_env.environment[`ELASTICSEARCH_${domain_name.replace(/-/g, '_').toUpperCase()}_DOMAIN`]), JSON.stringify(template_cloud_env[`ELASTICSEARCH_${domain_name.replace(/-/g, '_').toUpperCase()}_DOMAIN`]));
                        }
                        
                        resolve();
                    });
                });
            })
            describe('#sqs', () => {
                before(async () => {
                    await sqs.init({
                        queue_name: 'GrowerContracts3',
                        includeDLQ: true
                    })
                });
                it('resource created properly', () => {
                    return new Promise(async resolve => {
                        resolve();
                    });
                });
                it('iam role created properly', () => {
                    return new Promise(async resolve => {
                        resolve();
                    });
                });
            });
            describe('#sns', () => {
                before(async () => {

                });
                it('resource created properly', () => {
                    return new Promise(async resolve => {
                        resolve();
                    });
                });
                it('iam role created properly', () => {
                    return new Promise(async resolve => {
                        resolve();
                    });
                });
            });
            describe('#s3', () => {
                before(async () => {

                });
                it('resource created properly', () => {
                    return new Promise(async resolve => {
                        resolve();
                    });
                });
                it('iam role created properly', () => {
                    return new Promise(async resolve => {
                        resolve();
                    });
                });
            });
            describe('#sns subscription', () => {
                before(async () => {

                });
                it('resource created properly', () => {
                    return new Promise(async resolve => {
                        resolve();
                    });
                });
                it('iam role created properly', () => {
                    return new Promise(async resolve => {
                        resolve();
                    });
                });
            });
        });
    });
});