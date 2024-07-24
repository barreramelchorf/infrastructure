import * as k8s from '@pulumi/kubernetes';

export interface CronJob {
  /**
  Name describes the cronjob. If not provided, the type will be used in place.
   */
  name?: string;
  command?: string;
  schedule: string;
  enabled: boolean;
  suspend: boolean;
  activeDeadlineSeconds?: number;
  resources?: k8s.types.input.core.v1.ResourceRequirements;
  debug?: {
    enabled: boolean;
    trigger: string;
  };
}
