import * as aws from '@pulumi/aws';
import * as config from './config';

export const securityGroups: { [key: string]: aws.ec2.SecurityGroup } = {};

config.securityGroupConfigs.forEach((securityGroupConfig) => {
  securityGroups[securityGroupConfig.nameConfig] = new aws.ec2.SecurityGroup(
    `${config.projectName}-${securityGroupConfig.nameConfig}`,
    { ...securityGroupConfig,
      vpcId: config.vpcRef.apply(vpc=>{return vpc[securityGroupConfig.vpc].vpc.id})
     },
    { protect: false }
  );
});
