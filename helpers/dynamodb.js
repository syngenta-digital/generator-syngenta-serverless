const path = require('path');
const file = require('./file');
const mock = require('../test/mock/data');
const formatter = require('esformatter');
const { addPackage, addScript, create: create_package_json } = require('./package-json');

const _addServerlessVariables = async () => {

}

const _addEnvironmentVariables = async () => {

}

const _addDynamoDBResources = async (db_name) => {

}

const _iamRoles = async () => {

}

const _verifyPackageJsonExists = async (project_name = 'syngenta-generated-project-name') => {
    return create_package_json(project_name);
}

exports.init = async args => {
    
}