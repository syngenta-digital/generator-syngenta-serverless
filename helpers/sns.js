const file = require('./file');
const serverless_helper = require('./serverless');
const { addIamRole, addCustom } = require('../helpers/serverless');
const { topic: sns_topic_template, subscription: sns_subscription_template } = require('../templates/aws/resources/sns');

const _addServerlessVariables = async () => {
    const accounts = {
        key: 'accounts',
        value: {
            local: '0000000000',
            dev: '1111111111',
            qa: '2222222222',
            uat: '3333333333',
            prod: '4444444444'
        }
    }

    await addCustom(accounts);
    return true;
}

const _addIamRoles = async () => {
    return addIamRole('./aws/iamroles/sns.yml', 'sns');
}

const _addTopic = async (topic_name, dedup = false) => {
    const _path = `${file.root(true)}aws/resources/sns.yml`;

    const path_exists = await file.path_exists(_path);
    let read_resource = {
        Resources: {}
    };

    if(path_exists) {
        read_resource = await file.read_yaml(_path);
    }
    
    const template = sns_topic_template(topic_name, dedup);
    read_resource.Resources[`${topic_name}Topic`] = template;
    return file.write_yaml(_path, read_resource);
}

const _addSubscription = async (topic_name, queue_name) => {
    const _path = `${file.root(true)}aws/resources/sns.yml`;
    const path_exists = await file.path_exists(_path);
    let read_resource = {
        Resources: {}
    };
    if(path_exists) {
        read_resource = await file.read_yaml(_path);
    }

    const template = sns_subscription_template(topic_name, queue_name);
    read_resource.Resources[`${topic_name}Subscription`] = template;
    return file.write_yaml(_path, read_resource);
}

// TODO: this needs to be moved to serverless, but want to think it over so doing this here for now.
const _addToServerless = async () => {
    const doc = await file.read_yaml(`${file.root(true)}serverless.yml`);
    if(!doc.resources) {
        doc.resources = [];
    }
    const resource = `\${file(./aws/resources/sns.yml}`;
    const does_exist = doc.resources.find(x => x === resource);
    if(!does_exist) {
        doc.resources.push(resource);
        await file.write_yaml(`${file.root(true)}serverless.yml`, doc);
    }

    return true;
}

const _addResource = async (topic_name, queue_name, is_subscription, dedup) => {
    const resource = ['sns'];
    return serverless_helper.addResources(resource, {topic_name, queue_name, is_subscription, dedup});
}

exports.addTopic = async args => {
    const { topic_name, dedup } = args;
    await _addServerlessVariables();
    await _addIamRoles();
    // await _addTopic(topic_name, dedup);
    await _addResource(topic_name, null, false, dedup);
    await _addToServerless();
    return true;
}

exports.addSubscription = async args => {
    const { topic_name, queue_name } = args;
    await _addServerlessVariables();
    await _addIamRoles();
    // await _addSubscription(topic_name, queue_name);
    await _addResource(topic_name, queue_name, true);
    await _addToServerless();
    return true;
}

