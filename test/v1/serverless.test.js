const {assert} = require('chai');
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
                // _serverless = await serverless.addFunction({
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
                console.log('here! :D', exported);
                assert.equal(exported.functions[0].name, '${self:provider.stackTags.name}-v1-apigateway-handler');
            });
            it('handler', () => {
                const exported = _serverless.export();
                assert.equal(exported.functions[0].handler, 'application/v1/controller/apigateway/_router.route');
            });
            it('memorySize', () => {
                const exported = _serverless.export();
                assert.equal(exported.functions[0].memorySize, mock.properties.apigateway_memorySize);
            });
            it('timeout', () => {
                const exported = _serverless.export();
                assert.equal(exported.functions[0].timeout, mock.properties.apigateway_timeout);
            });
        })

    });

    describe('#cleanup', () => {
        it('delete serverless', () => {
            return new Promise(async resolve => {
                await file.delete_file(path.join(__dirname, 'serverless.yml'));
                const exists = await file.file_exists(path.join(__dirname, 'serverless.yml'));
                assert.equal(exists, false);
                resolve();
            })
        })
    })
});

// const {assert} = require('chai');
// require('chai').should();
// const mock = require('../mock/data');
// const serverless = require('../../helpers/serverless');
// const file = require('../../helpers/file');

// describe('Test Serverless Generator', async () => {
//     let _serverless = null;
//     describe('#serverless', () => {
//         it('create serverless', () => {
//             return new Promise(async resolve => {
//                 _serverless = await serverless.init({
//                     app: mock.properties.app,
//                     service: mock.properties.service
//                 })
//                 console.log('here?1?!?!!??')
//                 resolve(_serverless);
//             })
//         });
//         it('app name', () => {
//             console.log('logging _serverless', _serverless)
//             assert.equal(_serverless.app, mock.properties.app);
//         });
//         it('service name', () => {
//             assert.equal(_serverless.service, mock.properties.service);
//         });
//         // describe('serverless was created properly', (_serverless2) => {
//         //     console.log('logging _serverless', _serverless, 'logging _serverless2', _serverless2)

//         // })

//     });

//     // describe('#addFunction', () => {
//     //     it('add apigateway function', () => {
//     //         return new Promise(async resolve => {
//     //             _serverless = await serverless.addFunction({
//     //                 hash_type: 'v1-apigateway-handler',
//     //                 version: mock.properties.version,
//     //                 type: mock.properties.apigateway_type,
//     //                 name: mock.properties.apigateway_name,
//     //                 executor: mock.properties.apigateway_executor,
//     //                 memorySize: mock.properties.apigateway_memorySize,
//     //                 timeout: mock.properties.apigateway_timeout
//     //             })

//     //             resolve();
//     //         })
//     //     });
//     //     describe('apigateway was created properly', () => {
//     //         console.log('logging _serverless', _serverless);
//     //         it('version', () => {
//     //             console.log('here???', _serverless.functions[0].version);
//     //             assert.equal(_serverless.functions[0].version, mock.properties.version);
//     //         });
//     //         it('type', () => {
//     //             assert.equal(_serverless.functions[0].type, mock.properties.apigateway_type);
//     //         });
//     //     })

//     // });

//     describe('#cleanup', () => {
//         it('delete serverless', () => {
//             return new Promise(async resolve => {
//                 await file.delete_file('./serverless.yml');
//                 const exists = await file.file_exists('../serverless.yml');
//                 assert.equal(exists, false);
//                 resolve();
//             })
//         })
//     })
// });