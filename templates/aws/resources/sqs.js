exports.default = (queue_name, isFifo = false, includeDLQ = false, timeout = 30, maxRedriveReceiveCount = 5) => {
    const template = {
        [`${queue_name}Queue`]: {
            Type: 'AWS::SQS::Queue',
            Properties: {
              QueueName: `\${self:provider.stackTags.name}-${queue_name}-sqs`,
              VisibilityTimeout: timeout
            }
        },
        [`${queue_name}QueuePolicy`]:  {
            "Type": "AWS::SQS::QueuePolicy",
            "Properties": {
                "Queues": [
                    {
                        "Ref": `${queue_name}Queue`
                    }
                ],
                "PolicyDocument": {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": [
                            "sqs:CreateQueue",
                            "sqs:DeleteMessage",
                            "sqs:DeleteQueue",
                            "sqs:GetQueueUrl",
                            "sqs:ListQueues",
                            "sqs:ReceiveMessage",
                            "sqs:SendMessage"
                        ],
                        "Resource": {
                            "Fn::GetAtt": [
                                `${queue_name}Queue`,
                                "Arn"
                            ]
                        }
                        }
                    ]
                }
            }
        }
    }

    if(includeDLQ) {
        template[`${queue_name}Queue`].Properties.RedrivePolicy = {
            deadLetterTargetArn: {
                'Fn::GetAtt': [ `${queue_name}QueueDLQ`, 'Arn' ],
                maxReceiveCount: maxRedriveReceiveCount
            }
        }

        template[`${queue_name}QueueDLQ`] = {
            Type: 'AWS::SQS::Queue',
            Properties: {
              QueueName: `\${self:provider.stackTags.name}-${queue_name}-sqs-dlq`,
              VisibilityTimeout:  timeout
            }
        }
    }
}