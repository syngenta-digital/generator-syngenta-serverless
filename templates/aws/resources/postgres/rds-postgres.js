const template = (args) => {
    const {db_name} = args;
    return {
        Resources: {
            [`${db_name.replace(/-/g, '').trim()}DB`]: {
              Type: "AWS::RDS::DBInstance",
              Properties: {
                 AllowMajorVersionUpgrade: false,
                 AutoMinorVersionUpgrade: true,
                 AllocatedStorage: 100,
                 AvailabilityZone: "${self:provider.region}a",
                 PubliclyAccessible: true,
                 StorageType: "gp2",
                 DBInstanceClass: "${self:custom.db_instance_size.${self:provider.stage}}",
                 DBInstanceIdentifier: "${self:provider.stackTags.name}",
                 DBName: db_name,
                 VPCSecurityGroups: [
                    {
                       Ref: "SecurityGroup"
                    }
                 ],
                 DBSubnetGroupName: {
                    Ref: "SubnetGroup"
                 },
                 Engine: "aurora-postgresql",
                 MasterUsername: "root",
                 MasterUserPassword: "root_password"
              }
           }
        }
     }
 }
 
 exports.default = template;