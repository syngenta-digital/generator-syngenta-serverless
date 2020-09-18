const { assert } = require('chai');
const path = require('path');
require('chai').should();
const mock = require('../mock/data');
const file = require('../../helpers/file');
const ServerlessLogic = require('../../logic/serverless')

describe('Test Serverless Generator', async () => {
    let _serverless = new ServerlessLogic({});
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
        const _path = './aws/resources/apigateway.yml';
        it('add iam role', () => {
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
            it('was created in iamroles directory', async () => {
                return new Promise(async resolve => {
                    const exists = await file.path_exists(`${path.join(__dirname, '../../')}/aws/iamroles/dynamodb.yml`);
                    assert.equal(exists, true);
                    resolve();
                })

                // const exported = _serverless.export();
                // assert.equal(exported.provider.iamRoleStatements[0], `\${file(${path})}`);
            });
        });
    });

    describe('#cleanup', () => {
        it('delete serverless', () => {
            return new Promise(async resolve => {
                // TODO: this path stuff is way too confusing need to somehow reference parent dir.
                await file.delete_file(`${path.join(__dirname, '../../')}/serverless.yml`);
                // await file.delete_direcotry(`${path.join(__dirname, '../../')}aws`);
                const exists = await file.path_exists(`${path.join(__dirname, '../../')}/serverless.yml`);
                assert.equal(exists, false);
                resolve();
            })
        })
    })
});