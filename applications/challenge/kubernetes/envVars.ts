import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import { namespace } from './namespace';
import { getEnvVars } from '../../../libraries/getEnvVars';

export const envVars = new k8s.core.v1.ConfigMap(config.projectName, {
  metadata: {
    namespace: namespace.metadata.name,
    labels: config.app.labels,
  },
  data: {
    ...getEnvVars(),
  },
});
