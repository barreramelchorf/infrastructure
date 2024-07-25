import * as k8s from '@pulumi/kubernetes';
import * as config from './config';

export = async (provider: k8s.Provider, clusterName: string) => {
  const metricsServerConfig = config.metricsServerConfig.filter((metricsConfig) => metricsConfig.cluster === clusterName)[0];

  const namespace = new k8s.core.v1.Namespace(
    `${clusterName}-metrics-server`,
    {
      metadata: {
        name: 'metrics-server',
      },
    },
    {
      provider: provider,
    },
  );

  new k8s.helm.v3.Chart(
    `${clusterName}-metrics-server`,
    {
      chart: 'metrics-server',
      version: metricsServerConfig.chartVersion,
      resourcePrefix: `${clusterName}`,
      fetchOpts: {
        repo: 'https://kubernetes-sigs.github.io/metrics-server',
      },
      namespace: namespace.metadata.name,
      values: {
        podLabels: {
          'tags.datadoghq.com/env': config.environment,
        },
      },
    },
    { dependsOn: [namespace], provider: provider },
  );
};
