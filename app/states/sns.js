const sns = require('../../helpers/sns');
const file = require('../../helpers/file');
const { acceptableBoolean } = require('../helpers/boolean');
const { validResourceName } = require('../../helpers/string');

const timer = (time = 1000) => {
    return new Promise(resolve => {
        setTimeout(() => resolve(), time);
    })
}

const _topic_handler = async _this => {
    return _this.prompt([
        {
            type    : 'input',
            name    : 'topic_name',
            message : `What would you like topic name to be?`
        },
        {
            type    : 'input',
            name    : 'dedup',
            message : `Would you like Content-Based Deduplication?`
        }
    ])
}

const _available_queues = async () => {
    const sqs_path = `${file.root(true)}aws/resources/sqs.yml`;
    const read_sqs = await file.read_yaml(sqs_path);
    if(read_sqs) {
        const { Resources } = read_sqs;
        const available_queues = [];
    
        for (const [name, resource] of Object.entries(Resources)) {
            if(!name.includes('DLQ') && !name.includes('Policy')) {
                available_queues.push({
                    name,
                    resource
                })
            }
        }
    
        return available_queues;
    }

    return [];
}

const _available_topics = async () => {
    const sqs_path = `${file.root(true)}aws/resources/sns.yml`;
    const read_sqs = await file.read_yaml(sqs_path);
    if(read_sqs) {
        const { Resources } = read_sqs;
        const available_topics = [];
    
        for (const [name, resource] of Object.entries(Resources)) {
            if(name.includes('Topic')) {
                available_topics.push({
                    name,
                    resource
                })
            }
        }
    
        return available_topics;
    }

    return [];
}

const _subscription_handler = async _this => {
    // look at our current sqs queues and create a list of acceptable queues for user to pick?
    const sqs_path = `${file.root(true)}aws/resources/sqs.yml`;
    const sqs_exists = await file.path_exists(sqs_path);

    const no_queues_exist = async () => {
        console.error('\n\n >>>>> ERROR: No SQS Queues in project to subscribe to! Please create a SQS resource to create an SNS Subscription resource.\n\n');
        await timer(1000);
        return { failed: true }
    }

    const sns_path = `${file.root(true)}aws/resources/sns.yml`;
    const sns_exists = await file.path_exists(sns_path);

    const no_topics_exist = async () => {
        console.error('\n\n >>>>> ERROR: No SNS Topics in project to subscribe to! Please create a SNS Topic resource to create an SNS Subscription resource.\n\n');
        await timer(1000);
        return { failed: true }
    }

    if(sqs_exists && sns_exists) {
        const available_queues = await _available_queues();
        if(available_queues.length === 0) await no_queues_exist();

        const available_topics = await _available_topics();
        if(available_topics.length === 0) return no_topics_exist();

        if(available_topics.length === 0 && available_queues.length === 0) return null;

        return _this.prompt([
            {
                type    : 'input',
                name    : 'topic_name',
                message : `\n\n>>>>> Please select the following Topic you want to select for your subscription (enter the corresponding number)\n\n${available_topics.map((q, i) => `${i + 1}) ${validResourceName(q.name)}\n`)}\n\n`
            },
            {
                type    : 'input',
                name    : 'queue_name',
                message : `\n\n>>>>> Please select the following Queue you want to use as a stream (enter the corresponding number)\n\n${available_queues.map((q, i) => `${i + 1}) ${validResourceName(q.name)}\n`)}\n\n`
            }
        ])
    } else if(!sqs_exists && !sns_exists) {
        await no_queues_exist();
        await no_topics_exist();
        return null;
    } else  {
        return null;
    }
}

const _init = async _this => {
    return _this.prompt([
        {
            type    : 'input',
            name    : 'topic_or_sub',
            message : `========================== CREATING SNS RESOURCE ==========================\n\nSubscription or Topic?`
        }
    ])
}

const _addTopic = async (args) => {
    const { topic_name, dedup } = args;
    const _dedup = acceptableBoolean(dedup);
    return sns.addTopic({
        topic_name,
        dedup: _dedup
    })
}

const _addSubscription = async (args) => {
    const { topic_name, queue_name } = args;
    return sns.addSubscription({
        topic_name,
        queue_name
    })
}

exports.handler = async _this => {
    const init_response = await _init(_this);
    if(init_response.topic_or_sub.toLowerCase() === "subscription") {
        const subscription_response = await _subscription_handler(_this);
        if(subscription_response) {
            const available_queues = await _available_queues();
            const available_topics = await _available_topics();
                const { topic_name, queue_name } = subscription_response;
                const find_queue = available_queues.find((x, i) => (i + 1) == queue_name);
                const find_topic = available_topics.find((x, i) => (i + 1) == topic_name);
                return _addSubscription({ queue_name: find_queue.name.split('Queue')[0], topic_name: find_topic.name.split('Topic')[0]});
        }

        return null;

    } else if (init_response.topic_or_sub.toLowerCase() === "topic") {
        const topic_response = await _topic_handler(_this);
        if(!topic_response.failed) {
            return _addTopic(topic_response);
        }

        return null;
    }
}