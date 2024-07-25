import * as globalConfig from '../../../config/standard';
import { KubernetesWebAppConfiguration } from '../../../libraries/types';
import { getHost } from '../../../libraries/host';

// Standard configs
export * from '../../../config/standard';

export const app: KubernetesWebAppConfiguration = globalConfig.project.requireObject('app');
app.labels = {
  ...app.labels,
  'k8s.barreramelchorf.com/app': globalConfig.projectName,
  'k8s.barreramelchorf.com/service': globalConfig.projectName,
  'app.barreramelchorf.com/env': globalConfig.environment,
  'app.kubernetes.io/name': globalConfig.projectName,
  'app.kubernetes.io/part-of': globalConfig.projectName,
  'app.kubernetes.io/component': 'api',
  app: globalConfig.projectName,
};
app.host = getHost();

