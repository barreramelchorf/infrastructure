import * as pulumi from '@pulumi/pulumi';
import * as globalConfig from '../../../config/standard';
import * as aws from '@pulumi/aws';
// Standard configs
export * from '../../../config/standard';

interface DatabaseConfig {
  engineVersion: string;
  engine: string,
  size: number;
  instanceClass: string;
  vpc: string,
  availabilityZones: string[];
}

export const securityGroup: pulumi.Output<aws.ec2.SecurityGroup> = new pulumi.StackReference(`organization/security-group/${globalConfig.environment}`)
  .getOutput('securityGroups')
  .apply((securityGroups: { securityGroups: {[key: string]: aws.ec2.SecurityGroup }}) => {
    return securityGroups.securityGroups['sg-staging'];
  });

export const databaseConfig: DatabaseConfig = globalConfig.project.requireObject('databaseConfig');

export const privateSubnets = new pulumi.StackReference(`organization/vpc/${globalConfig.environment}`).getOutput('vpcConf').apply(vpcConfValue=>{
  return vpcConfValue[databaseConfig.vpc].privateSubnets.map((subnet: any) => subnet.id)
})

export const stagingRef = new pulumi.StackReference(`organization/${globalConfig.projectName}/staging`);

export const tags = {
  Name: `${globalConfig.environment}-${globalConfig.projectName}`,
  Environment: globalConfig.environment,
  Project: globalConfig.projectName,
};
