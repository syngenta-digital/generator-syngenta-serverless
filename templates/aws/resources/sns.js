exports.topic = (topic_name, dedup = false) => {
    const template = {
        ContentBasedDeduplication: dedup,
        DisplayName: topic_name,
        TopicName: `\${self:provider.stage}-${topic_name}`
    }

    return template;
}

// TopicArn: arn:aws:sns:${self:provider.region}:${self:custom.accounts.${self:provider.stage}}:${self:provider.stage}-platform-model-revisions
exports.subscription = (topic_name, sqs_queue_name) => {
    const template = {
        Type: "AWS::SNS::Subscription",
        Properties: {
           Protocol: "sqs",
           Endpoint: {
              'Fn::GetAtt': [
                 `${sqs_queue_name}Queue`,
                 "Arn"
              ]
           },
           Region: "${self:provider.region}",
           TopicArn: `arn:aws:sns:\${self:provider.region}:\${self:custom.accounts.\${self:provider.stage}}:\${self:provider.stage}-${topic_name}`,
           RawMessageDelivery: true,
           FilterPolicy: {
              docusign_event: [
                 "callback"
              ]
           }
        }
    }

    return template;
}