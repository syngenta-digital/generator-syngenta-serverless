// ENV (allow for multiple though)
// ELASTICSEARCH_DOMAIN:
// Fn::GetAtt:
//     - Elasticsearch
//     - DomainEndpoint
// ELASTICSEARCH_INDEX: ${self:custom.es.index}
// ELASTICSEARCH_TYPE: ${self:custom.es.type}

// serverless custom (allow for multiple? es.[name]?)
// es:
// domain: ${self:provider.stackName}-search
// index: enogen ( ask from user )
// type: contract ( ask from user )
// version: 7.7
// endpoints:
//     local: search-${self:custom.es.domain}-l7p5piqzo3efmssb6zpbsnxbsm.us-east-2.es.amazonaws.com
// volumes:
//     local: 10
//     dev: 10
//     qa: 10
//     uat: 20
//     prod: 20
// instance_size:
//     local: t2.medium.elasticsearch
//     dev: t2.medium.elasticsearch
//     qa: t2.medium.elasticsearch
//     uat: r5.xlarge.elasticsearch
//     prod: r5.xlarge.elasticsearch
// instance_count: '1'

// add to serverless resources
const path = require('path');
const file = require('./file');
const mock = require('../test/mock/data');
const formatter = require('esformatter');
const { addIamRole } = require('../helpers/serverless');
const { default: sqs_queue_template } = require('../templates/aws/resources/sqs');

// const _addServerlessVariables = async () => {

//     return true;
// }

const _addIamRoles = async () => {
    return addIamRole('aws/iamroles/sqs.yml', 'sqs');
}

const _addResource = async (queue_name, isFifo = false, includeDLQ = false, timeout = 30, maxRedriveReceiveCount = 5) => {
    const template = sqs_queue_template(queue_name, isFifo, includeDLQ, timeout, maxRedriveReceiveCount);
    
    const _path = `${path.join(__dirname, '..')}/aws/resources/sqs.yml`;
    const path_exists = await file.path_exists(_path);
    let read_resource = {
        Resources: {}
    };
    if(path_exists) {
        read_resource = await file.read_yaml(_path);
    }

    read_resource.Resources = { ...read_resource.Resources, ...template }
    return file.write_yaml(_path, read_resource);
}

exports.init = async args => {
    const {  queue_name, isFifo, includeDLQ, timeout, maxRedriveReceiveCount } = args;
    await _addIamRoles();
    await _addResource(queue_name, isFifo, includeDLQ, timeout, maxRedriveReceiveCount);
    return true;
}