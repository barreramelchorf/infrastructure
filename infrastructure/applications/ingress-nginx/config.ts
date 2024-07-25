import * as k8s from '@pulumi/kubernetes';
import * as standard from '../../../config/standard';
export * from '../../../config/standard';
import * as pulumi from '@pulumi/pulumi';

interface NginxConfiguration {
  version: string;
  vpc: string;
  replicas: {
    min: number;
    max: number;
  };
  resources: k8s.types.input.core.v1.ResourceRequirements;
}

export const nginx: NginxConfiguration = standard.project.requireObject('config');

const vpcRef = new pulumi.StackReference(`organization/vpc/${standard.environment}`).getOutput('vpcConf');
export const privateSubnets: pulumi.Output<string> = vpcRef.apply((vpcConfValue: any) => {
  const subnets = vpcConfValue[nginx.vpc].privateSubnets;
  const ids: string[] = subnets.map((subnet: any) => subnet.id);
  return ids.join(',');
});

export const publicSubnets: pulumi.Output<string> = vpcRef.apply((vpcConfValue: any) => {
  const subnets = vpcConfValue[nginx.vpc].publicSubnets;
  const ids: string[] = subnets.map((subnet: any) => subnet.id);
  return ids.join(',');
});
