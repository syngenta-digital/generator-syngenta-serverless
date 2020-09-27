exports.bucket = (bucket_name) => {
    return  {
        Type: 'AWS::S3::Bucket',
        Properties: {
            BucketName: `\${self:provider.stackTags.name}-${bucket_name}-storage`,
            CorsConfiguration: {
                CorsRules: [
                    {
                        AllowedMethods: ['GET'],  
                        AllowedOrigins: ["*"]
                    }
                ]
            }
        }
    }
}

exports.public_policy = (bucket_name) => {
    return {
        // [`AttachmentsBucketAllowPublicReadPolicy${bucket_name}`]: {
            Type: 'AWS::S3::BucketPolicy',
            Properties: {
                Bucket: `!Ref ${bucket_name}Storage`,
                PolicyDocument: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: 'Allow',
                            Action: [
                                "s3:GetObject",
                                "s3:GetObjectAcl"
                            ],
                            Resource: `arn:aws:s3:::\${self:provider.stackTags.name}-${bucket_name}-storage/*`,
                            Principal: "*"
                        }
                    ]
                }
            }
        // }
    }
}

exports.website = (bucket_name) => {

}