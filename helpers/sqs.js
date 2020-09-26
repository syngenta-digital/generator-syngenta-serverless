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

const _environmentVariables = async (domain_name, index, type) => {

    return true;
}

const _addServerlessVariables = async () => {

    return true;
}

const _addIamRoles = async () => {

    return true;
}

const _addDomain = async (domain_name, index, type) => {

    return true;
}

const _addEsToServerlessCustom = async (domain_name, index, type, region = 'us-east-2') => {

    return true;
}

exports.init = async args => {
    const { domain_name, index, type, region } = args;
    await _environmentVariables(domain_name, index, type);
    await _addServerlessVariables();
    await _addIamRoles();
    await _addDomain(domain_name, index, type);
    await _addEsToServerlessCustom(domain_name, index, type, region);
    return true;
}