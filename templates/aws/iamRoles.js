exports.ddbTemplate = () => {
  return {
    Effect: 'Allow',
    Action: [
      'dynamodb:BatchGetItem',
      'dynamodb:BatchWriteItem',
      'dynamodb:DeleteItem',
      'dynamodb:DescribeTable',
      'dynamodb:DescribeTimeToLive',
      'dynamodb:GetItem',
      'dynamodb:GetRecords',
      'dynamodb:ListTables',
      'dynamodb:PutItem',
      'dynamodb:Query',
      'dynamodb:Scan',
      'dynamodb:UpdateItem',
      'dynamodb:UpdateTable',
      'dynamodb:GetShardIterator',
      'dynamodb:DescribeStream',
      'dynamodb:ListStreams'
    ],
    Resource: [
      'arn:aws:dynamodb:*:*:table/${self:provider.stackTags.name}-*',
      'arn:aws:dynamodb:*:*:table/${self:provider.stackTags.name}-*/index/*',
      'arn:aws:dynamodb:*:*:table/${self:provider.stackTags.name}-*/stream/*'
    ]
  }
}

exports.s3Template = (bucket_name) => {
  return {
    Effect: 'Allow',
    Action: [
      's3:*'
    ],
    Resource: [
      `arn:aws:s3:::\${self:provider.stackTags.name}-${bucket_name}/*`
    ]
  }
}

exports.snsTemplate = () => {
  return {
    Effect: 'Allow',
    Action: [
      'SNS:Publish'
    ],
    Resource: [
      '${self:custom.policies.sns}'
    ]
  }
}

exports.sqsTemplate = () => {
  return {
    Effect: 'Allow',
    Action: [
      'sqs:SendMessage',
      'sqs:ReceiveMessage'
    ],
    Resource: [
      '${self:custom.arn.sqs}'
    ]
  }
}

exports.ssmTemplate = () => {
  return {
    Effect: 'Allow',
    Action: [
      'ssm:*'
    ],
    Resource: [
      `arn:aws:ssm:\${self:provider.region}:*:parameter/\${self:provider.stackTags.name}/*`
    ]
  }
}