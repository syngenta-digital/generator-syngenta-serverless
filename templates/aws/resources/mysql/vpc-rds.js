const template = () => {
   return {
      Resources: {
         RDSVPC: {
            Type: "AWS::EC2::VPC",
            Properties: {
               CidrBlock: "172.30.0.0/16",
               EnableDnsHostnames: true,
               EnableDnsSupport: true,
               InstanceTenancy: "default",
               Tags: [
                  {
                     Key: "Name",
                     Value: "${self:provider.stackTags.name}"
                  }
               ]
            }
         },
         RDSSubnetGroup: {
            Type: "AWS::RDS::DBSubnetGroup",
            Properties: {
               DBSubnetGroupDescription: "${self:provider.stackTags.name}",
               DBSubnetGroupName: "${self:provider.stackTags.name}",
               SubnetIds: [
                  {
                     Ref: "RDSSubnetA"
                  },
                  {
                     Ref: "RDSSubnetB"
                  },
                  {
                     Ref: "RDSSubnetC"
                  }
               ],
               Tags: [
                  {
                     Key: "Name",
                     Value: "${self:provider.stackTags.name}"
                  }
               ]
            }
         },
         RDSSubnetA: {
            Type: "AWS::EC2::Subnet",
            Properties: {
               AvailabilityZone: "${self:provider.region}a",
               CidrBlock: "172.30.0.0/24",
               VpcId: {
                  Ref: "RDSVPC"
               },
               Tags: [
                  {
                     Key: "Name",
                     Value: "${self:provider.stackTags.name}"
                  }
               ]
            }
         },
         RDSSubnetB: {
            Type: "AWS::EC2::Subnet",
            Properties: {
               AvailabilityZone: "${self:provider.region}b",
               CidrBlock: "172.30.1.0/24",
               VpcId: {
                  Ref: "RDSVPC"
               },
               Tags: [
                  {
                     Key: "Name",
                     Value: "${self:provider.stackTags.name}"
                  }
               ]
            }
         },
         RDSSubnetC: {
            Type: "AWS::EC2::Subnet",
            Properties: {
               AvailabilityZone: "${self:provider.region}c",
               CidrBlock: "172.30.2.0/24",
               VpcId: {
                  Ref: "RDSVPC"
               },
               Tags: [
                  {
                     Key: "Name",
                     Value: "${self:provider.stackTags.name}"
                  }
               ]
            }
         },
         RDSSubnetRouteTableAssociation: {
            Type: "AWS::EC2::SubnetRouteTableAssociation",
            Properties: {
               RouteTableId: {
                  Ref: "RDSRouteTable"
               },
               SubnetId: {
                  Ref: "RDSSubnetA"
               }
            }
         },
         RDSGateway: {
            Type: "AWS::EC2::InternetGateway",
            Properties: {
               Tags: [
                  {
                     Key: "Name",
                     Value: "${self:provider.stackTags.name}"
                  }
               ]
            }
         },
         RDSVPCGatewayAttachment: {
            Type: "AWS::EC2::VPCGatewayAttachment",
            Properties: {
               VpcId: {
                  Ref: "RDSVPC"
               },
               InternetGatewayId: {
                  Ref: "RDSGateway"
               }
            }
         },
         RDSRouteTable: {
            Type: "AWS::EC2::RouteTable",
            Properties: {
               VpcId: {
                  Ref: "RDSVPC"
               },
               Tags: [
                  {
                     Key: "Name",
                     Value: "${self:provider.stackTags.name}"
                  }
               ]
            }
         },
         RDSPublicRoute: {
            DependsOn: "RDSVPCGatewayAttachment",
            Type: "AWS::EC2::Route",
            Properties: {
               RouteTableId: {
                  Ref: "RDSRouteTable"
               },
               DestinationCidrBlock: "0.0.0.0/0",
               GatewayId: {
                  Ref: "RDSGateway"
               }
            }
         }
      }
   }
}

exports.default = template;