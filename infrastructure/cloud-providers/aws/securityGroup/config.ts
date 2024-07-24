import * as standard from '../../../../config/standard';
import { SecurityGroupArgs } from '@pulumi/aws/ec2/securityGroup';
export * from '../../../../config/standard';

interface SecurityGroupConfig extends SecurityGroupArgs {
  nameConfig: string;
}

export const securityGroupConfigs: SecurityGroupConfig[] = standard.project.requireObject('securityGroups');
