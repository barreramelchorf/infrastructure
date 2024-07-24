import * as k8s from '@pulumi/kubernetes';

export interface Deployment {
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
    cpu?: k8s.types.input.autoscaling.v2beta2.ResourceMetricSource;
    memory?: k8s.types.input.autoscaling.v2beta2.ResourceMetricSource;
    external?: k8s.types.input.autoscaling.v2beta2.ExternalMetricSource;
  };
  env?: {
    [key: string]: string;
  };
}
