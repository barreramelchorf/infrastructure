import * as k8s from '@pulumi/kubernetes';
import * as standard from '../../../config/standard';
export * from '../../../config/standard';

interface NginxConfiguration {
  version: string;
  replicas: {
    min: number;
    max: number;
  };
  resources: k8s.types.input.core.v1.ResourceRequirements;
}

export const nginx: NginxConfiguration = standard.project.requireObject('config');
