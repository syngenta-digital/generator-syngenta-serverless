const template = (db_name, range_key) => {
    const base = {
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

    if(range_key) {
        base.Properties.AttributeDefinitions.push({
            AttributeName: range_key,
            AttributeType: "S"
        })

        base.Properties.KeySchema.push({
            AttributeName: range_key,
            KeyType: "RANGE"
        })

        base.Properties.GlobalSecondaryIndexes.push({
            IndexName: range_key,
            KeySchema: [
                {
                    AttributeName: range_key,
                    KeyType: "HASH"
                }
            ],
            Projection: {
                ProjectionType: "ALL"
            }
        })
    }

    return base;
}

exports.default = template;

