// this file will help with any serverless or associated file building.
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const file = require('./file');
const SERVERLESS_LOCATION = `${path.join(__dirname, '../serverless.yml')}`;

const _initServerless = (app, service) => {
    return new Promise(async (resolve) => {
        // TODO: this path stuff is way too confusing need to somehow reference parent dir.
        let doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/templates/serverless/serverless.yml`, 'utf8'));
        doc.app = app;
        doc.service = service;
        // TODO: i think this will need to be changed if this is going to be a package
        resolve(file.write_yaml(SERVERLESS_LOCATION, doc));
    })
}

const _apigatewayHandler = (doc, version, type, name, executor = 'run', memorySize = 256, timeout = 30) => {
    const apigateway_function = {
        name: `\${self:provider.stackTags.name}-${version}-${type}-${name}`,
        description: 'Create default templates',
        handler: `application/${version}/controller/${type}/_router.${executor}`,
        memorySize,
        timeout
    }
    
    doc.functions['v1-apigateway-handler'] = apigateway_function;
    return apigateway_function;
}

const functionHashMapper = new Map([
    ['v1-apigateway-handler', _apigatewayHandler],
]);

const _addFunction = async (hash_type, version, type, name, executor = 'run', memorySize = 256, timeout = 30) => {
    // TODO: this path stuff is way too confusing need to somehow reference parent dir.
    const doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/serverless.yml`, 'utf8'));
    const result = functionHashMapper.get(hash_type)(doc, version, type, name, executor, memorySize, timeout);
    await file.write_yaml(SERVERLESS_LOCATION, doc);
    return result;
}

const _addIamRole = async (_path) => {
    // TODO: this path stuff is way too confusing need to somehow reference parent dir.
    let doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, '..')}/serverless.yml`, 'utf8'));
    const { provider } = doc;
    const { iamRoleStatements } = provider;
    const iamrole = `\${file(${_path})}`;
    console.log('logging iamRoleStatements', iamRoleStatements[0]);
    if(iamRoleStatements.length === 1 && iamRoleStatements[0] === 'override_me') {
        doc.provider.iamRoleStatements = [];
    }
    doc.provider.iamRoleStatements.push(iamrole);
    await file.write_yaml(SERVERLESS_LOCATION, doc);
    return iamrole;
}

exports.init = async (app, service) => {
    return _initServerless(app, service);
}

exports.addFunction = async (args) => {
    const { version, hash_type, type, name, executor, memorySize, timeout } = args;
    return _addFunction(hash_type, version, type, name, executor, memorySize, timeout);
}

exports.addIamRole = async (path) => {
    return _addIamRole(path);
}
