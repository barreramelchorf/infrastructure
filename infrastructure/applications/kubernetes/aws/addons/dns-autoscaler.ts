import * as k8s from '@pulumi/kubernetes';
import * as config from './config';

export = async (provider: k8s.Provider, clusterName: string) => {
  new k8s.yaml.ConfigFile(
    `${clusterName}-dns-autoscaler-${config.environment}`,
    {
      file: `addons/autoscaler.yml`,
      resourcePrefix: `${clusterName}`,
    },
    { provider: provider }
  );
};
