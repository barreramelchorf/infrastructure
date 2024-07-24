import * as standard from '../../../../config/standard';
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Standard configs
export * from '../../../../config/standard';

interface EksNode {
  name: string;
  instanceType: aws.ec2.InstanceType;
  spot: boolean;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  size: number;
  labelName: string;
  amiId: string;
}

interface EksConfiguration {
  name: string;
  version: string;
  vpc: string;
  private: boolean;
  nodes: EksNode[];
}

interface User {
  username: string;
  arn: string;
  group: string;
}

export const clusters: EksConfiguration[] = standard.project.requireObject('eks');

export const awsAccountId = standard.project.require('awsAccountId');

export const users: User[] = standard.project.requireObject('users');

export const tags = {
  Environment: standard.environment,
  Project: 'barreramelchorf',
  InfrastructureComponent: 'cluster-aws',
};
