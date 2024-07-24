import * as k8s from '@pulumi/kubernetes';

export = async (clusters: { [name: string]: k8s.Provider }) => {
  const providers = Object.keys(clusters);
  for (const key in providers) {
    const clusterName = providers[key];
    await require('./dns-autoscaler')(clusters[clusterName], clusterName);
    await require('./dns-cache')(clusters[clusterName], clusterName);
  }
};
