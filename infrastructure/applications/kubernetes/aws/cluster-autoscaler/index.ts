import * as k8s from '@pulumi/kubernetes';
import * as config from './config';

export = async (clusters: { [name: string]: k8s.Provider }) => {
  const providers = Object.keys(clusters);
  for (const key in providers) {
    const clusterName = providers[key];
    const autoscalerConfig = config.clusterAutoscalerConfig.filter((autoscalerConfig) => autoscalerConfig.cluster === clusterName)[0];
    if (!autoscalerConfig.enabled) {
      continue;
    }
    await require('./chart')(clusters[clusterName], clusterName);
  }
};
