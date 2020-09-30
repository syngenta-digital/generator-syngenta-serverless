const sns = require('../../helpers/sns');
const file = require('../../helpers/file');

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

const _subscription_handler = async _this => {
    // look at our current sqs queues and create a list of acceptable queues for user to pick?
    const sqs_path = `${file.root(true)}aws/resources/sqs.yml`;
    const sqs_exists = await file.path_exists(sqs_path);

    const no_queues_exist = async () => {
        console.error('\n\n >>>>> ERROR: No SQS Queues in project to subscribe to! Please create a SQS resource to create an SNS Subscription resource.\n\n');
        await timer(2000);
        return { failed: true }
    }

    if(sqs_exists) {
        const read_sqs = await file.read_yaml(sqs_path);
        const { Resources } = read_sqs;
        const available_queues = [];

        for (const [name, resource] of Object.entries(Resources)) {
            if(!name.contains('DLQ') && !name.contains('Policy')) {
                available_queues.push({
                    name,
                    resource
                })
            }
        }
        console.log('logging available_queues', available_queues);
        if(available_queues.length === 0) return no_queues_exist();

        return _this.prompt([
            {
                type    : 'input',
                name    : 'topic_name',
                message : `Whats the ARN for the topic you are subscribing to?`
            },
            {
                type    : 'input',
                name    : 'queue_name',
                message : `Whats the SQS queue name you are going to use for your SNS subscription trigger?`
            }
        ])
    } else {
       return no_queues_exist();
    }
}

const _init = async _this => {
    return _this.prompt([
        {
            type    : 'input',
            name    : 'topic_or_sub',
            message : `Subscription or Topic?`
        }
    ])
}

const _addTopic = async (args) => {
    const { topic_name, dedup } = args;
    return sns.addTopic({
        topic_name,
        dedup
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
        const topic_response = await _subscription_handler(_this);
        return _addSubscription(topic_response);     
    } else if (init_response.topic_or_sub.toLowerCase() === "topic") {
        const subscription_response = await _topic_handler(_this);
        if(!subscription_response.failed) {
            return _addTopic(subscription_response);
        }

        return null;
    }
}