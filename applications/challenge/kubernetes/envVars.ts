import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import { namespace } from './namespace';
import { getEnvVars } from '../../../libraries/getEnvVars';
import {record} from '../aws/database'

export const envVars = new k8s.core.v1.ConfigMap(config.projectName, {
  metadata: {
    namespace: namespace.metadata.name,
    labels: config.app.labels,
  },
  data: {
    POSTGRES_HOST: record.fqdn,
    ...getEnvVars(),
  },
});
