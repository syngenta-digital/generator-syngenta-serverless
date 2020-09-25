const template = (db_name) => {
    return {
        Type: "AWS::DynamoDB::Table",
        Properties: {
            TableName: `\${self:provider.stackTags.name}-${db_name.toLowerCase()}`,
            BillingMode: "PAY_PER_REQUEST",
            StreamSpecification: {
            StreamViewType: "${self:custom.stream_view.${self:provider.stage}}"
            },
            PointInTimeRecoverySpecification: {
            PointInTimeRecoveryEnabled: "${self:custom.ddb_recovery.${self:provider.stage}}"
            },
            AttributeDefinitions: [
                {
                    AttributeName: `${db_name.replace(/-/g, '_').toLowerCase()}_id`,
                    AttributeType: "S"
                }
            ],
            KeySchema: [
                {
                    AttributeName: `${db_name.replace(/-/g, '_').toLowerCase()}_id`,
                    KeyType: "HASH"
                }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: `${db_name.replace(/-/g, '_').toLowerCase()}_id`,
                    KeySchema: [
                        {
                            AttributeName: `${db_name.replace(/-/g, '_').toLowerCase()}_id`,
                            KeyType: "HASH"
                        }
                    ],
                    Projection: {
                        ProjectionType: "ALL"
                    }
                }
            ]
        }
    }
}

exports.default = template;

