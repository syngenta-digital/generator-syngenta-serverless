// this file will help with any serverless or associated file building.
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const file = require('./file');
const logger = require('./logger');
const SERVERLESS_LOCATION = `${path.join(__dirname, 'serverless.yml')}`;

const _initServerless = (app, service) => {
    return new Promise(async (resolve) => {
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
    ['v1-apigateway-handler', _apigatewayHandler]
]);

const _addFunction = async (hash_type, version, type, name, executor = 'run', memorySize = 256, timeout = 30) => {
    let doc = yaml.safeLoad(fs.readFileSync(`${path.join(__dirname, 'serverless.yml')}`, 'utf8'));
    const result = functionHashMapper.get(hash_type)(doc, version, type, name, executor, memorySize, timeout);
    await file.write_yaml(SERVERLESS_LOCATION, doc);
    return result;
}

const _addIamRole = (name) => {

}

exports.init = async (app, service) => {
    return _initServerless(app, service);
}

exports.addFunction = async (args) => {
    const { version, hash_type, type, name, executor, memorySize, timeout } = args;
    return _addFunction(hash_type, version, type, name, executor, memorySize, timeout);
}
