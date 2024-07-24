import * as k8s from '@pulumi/kubernetes';
import { App } from './app';

export interface KubernetesAppConfiguration extends App {
  labels: {
    [key: string]: string;
  };
  env: {
    [key: string]: string;
  };
  deployment: {
    replicas: {
      min: number;
      max: number;
    };
    containers: {
      [key: string]: {
        resources?: k8s.types.input.core.v1.ResourceRequirements;
      };
    };
    autoscaling?: {
      nginx?: {
        requestsPerSecond: number;
      };
      cpu?: k8s.types.input.autoscaling.v2.ResourceMetricSource;
      memory?: k8s.types.input.autoscaling.v2.ResourceMetricSource;
    };
  };
  stores: string[];
  imageRepository: string;
}
