import * as k8s from '@pulumi/kubernetes';

export interface Job {
  /**
  Name describes the cronjob. If not provided, the type will be used in place.
   */
  name?: string;
  command?: string;
  enabled: boolean;
  suspend: boolean;
  activeDeadlineSeconds?: number;
  resources?: k8s.types.input.core.v1.ResourceRequirements;
}
