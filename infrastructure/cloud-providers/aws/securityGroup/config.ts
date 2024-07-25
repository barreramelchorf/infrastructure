import * as standard from '../../../../config/standard';
import { SecurityGroupArgs } from '@pulumi/aws/ec2/securityGroup';
export * from '../../../../config/standard';
import * as pulumi from '@pulumi/pulumi';

interface SecurityGroupConfig extends SecurityGroupArgs {
  nameConfig: string;
  vpc: string;
}

export const vpcRef = new pulumi.StackReference(`organization/vpc/${standard.environment}`).getOutput('vpcConf');

export const securityGroupConfigs: SecurityGroupConfig[] = standard.project.requireObject('securityGroups');
