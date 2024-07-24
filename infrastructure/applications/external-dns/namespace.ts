import * as k8s from '@pulumi/kubernetes';
import * as config from './config';

export const namespace = new k8s.core.v1.Namespace(config.projectName, {
  metadata: {
    name: 'external-dns',
  },
});
