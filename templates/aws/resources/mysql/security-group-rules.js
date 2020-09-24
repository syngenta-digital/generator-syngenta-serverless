const template = () => {
   return {
      groups: {
         local: {
            rds: {
               inbound: [
                  {
                     IpProtocol: -1,
                     CidrIp: "0.0.0.0/0",
                     FromPort: -1,
                     ToPort: -1
                  }
               ]
            },
            lambda: {
               inbound: [
                  {
                     IpProtocol: -1,
                     CidrIp: "0.0.0.0/0",
                     FromPort: -1,
                     ToPort: -1
                  }
               ],
               outbound: [
                  {
                     IpProtocol: -1,
                     CidrIp: "0.0.0.0/0",
                     FromPort: -1,
                     ToPort: -1
                  }
               ]
            }
         },
         dev: {
            rds: {
               inbound: [
                  {
                     IpProtocol: "tcp",
                     CidrIp: "0.0.0.0/0",
                     FromPort: 3306,
                     ToPort: 3306
                  }
               ]
            },
            lambda: {
               inbound: [
                  {
                     IpProtocol: "tcp",
                     CidrIp: "0.0.0.0/0",
                     FromPort: 443,
                     ToPort: 443
                  }
               ],
               outbound: [
                  {
                     IpProtocol: -1,
                     CidrIp: "0.0.0.0/0",
                     FromPort: -1,
                     ToPort: -1
                  }
               ]
            }
         },
         qa: {
            rds: {
               inbound: [
                  {
                     IpProtocol: "tcp",
                     CidrIp: "0.0.0.0/0",
                     FromPort: 3306,
                     ToPort: 3306
                  }
               ]
            },
            lambda: {
               inbound: [
                  {
                     IpProtocol: "tcp",
                     CidrIp: "0.0.0.0/0",
                     FromPort: 443,
                     ToPort: 443
                  }
               ],
               outbound: [
                  {
                     IpProtocol: -1,
                     CidrIp: "0.0.0.0/0",
                     FromPort: -1,
                     ToPort: -1
                  }
               ]
            }
         },
         uat: {
            rds: {
               inbound: [
                  {
                     IpProtocol: "tcp",
                     CidrIp: "0.0.0.0/0",
                     FromPort: 3306,
                     ToPort: 3306
                  }
               ]
            },
            lambda: {
               inbound: [
                  {
                     IpProtocol: "tcp",
                     CidrIp: "0.0.0.0/0",
                     FromPort: 443,
                     ToPort: 443
                  }
               ],
               outbound: [
                  {
                     IpProtocol: -1,
                     CidrIp: "0.0.0.0/0",
                     FromPort: -1,
                     ToPort: -1
                  }
               ]
            }
         },
         prod: {
            rds: {
               inbound: [
                  {
                     IpProtocol: "tcp",
                     CidrIp: "0.0.0.0/0",
                     FromPort: 3306,
                     ToPort: 3306
                  }
               ]
            },
            lambda: {
               inbound: [
                  {
                     IpProtocol: "tcp",
                     CidrIp: "0.0.0.0/0",
                     FromPort: 443,
                     ToPort: 443
                  }
               ],
               outbound: [
                  {
                     IpProtocol: -1,
                     CidrIp: "0.0.0.0/0",
                     FromPort: -1,
                     ToPort: -1
                  }
               ]
            }
         }
      }
   }
}

exports.default = template;