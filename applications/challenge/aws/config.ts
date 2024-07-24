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
  subnetIds: string[];
  availabilityZones: string[];
}

export const securityGroup: pulumi.Output<aws.ec2.SecurityGroup> = new pulumi.StackReference(`organization/security-group/${globalConfig.environment}`)
  .getOutput('securityGroups')
  .apply((securityGroups: { [key: string]: aws.ec2.SecurityGroup }) => {
    return securityGroups['sg-staging'];
  });

export const databaseConfig: DatabaseConfig = globalConfig.project.requireObject('databaseConfig');

export const tags = {
  Name: `${globalConfig.environment}-${globalConfig.projectName}`,
  Environment: globalConfig.environment,
  Project: globalConfig.projectName,
};
