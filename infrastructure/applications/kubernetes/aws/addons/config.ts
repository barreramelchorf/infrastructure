import * as standard from '../../../../../config/standard';
export * from '../../../../../config/standard';

interface ClusterAutoscalerConfiguration {
  cluster: string;
  chartVersion: string;
}

export const clusterAutoscalerConfig: ClusterAutoscalerConfiguration[] = standard.project.requireObject('cluster-autoscaler');
