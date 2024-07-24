import * as k8s from '@pulumi/kubernetes';
import * as config from './config';

export = async (provider: k8s.Provider, clusterName: string) => {
  const clusterAutoscalerConfig = config.clusterAutoscalerConfig.filter((autoscalerConfig) => autoscalerConfig.cluster === clusterName)[0];

  const namespace = new k8s.core.v1.Namespace(
    `${clusterName}-cluster-autoscaler`,
    {
      metadata: {
        name: 'cluster-autoscaler',
      },
    },
    {
      provider: provider,
    }
  );

  new k8s.helm.v3.Chart(
    `${clusterName}-cluster-autoscaler`,
    {
      chart: 'cluster-autoscaler',
      version: clusterAutoscalerConfig.chartVersion,
      fetchOpts: {
        repo: 'https://kubernetes.github.io/autoscaler',
      },
      namespace: namespace.metadata.name,
      values: {
        autoDiscovery: {
          clusterName: `${clusterName}-cluster-${config.environment}`,
          tags: [`k8s.io/cluster-autoscaler/${clusterName}-cluster-${config.environment}`],
        },
        awsRegion: 'us-east-1',
        extraArgs: {
          'skip-nodes-with-system-pods': false,
          'skip-nodes-with-local-storage': false,
        },
        podLabels: {
          'tags.datadoghq.com/env': config.environment,
        },
      },
    },
    { dependsOn: [namespace], provider: provider }
  );
};
