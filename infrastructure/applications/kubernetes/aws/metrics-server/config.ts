import * as standard from '../../../../../config/standard';
export * from '../../../../../config/standard';

interface MetricsServerConfiguration {
  cluster: string;
  chartVersion: string;
  enabled: boolean;
}

export const metricsServerConfig: MetricsServerConfiguration[] = standard.project.requireObject('metrics-server');
