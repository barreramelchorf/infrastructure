import * as standard from '../../../../../config/standard';
export * from '../../../../../config/standard';

interface ClusterAutoscalerConfiguration {
  cluster: string;
  chartVersion: string;
  enabled: boolean;
}

export const clusterAutoscalerConfig: ClusterAutoscalerConfiguration[] = standard.project.requireObject('cluster-autoscaler');
