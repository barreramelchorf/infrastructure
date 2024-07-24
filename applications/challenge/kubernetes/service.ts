import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import { namespace } from './namespace';
import * as pulumi from '@pulumi/pulumi';

export const service = new k8s.core.v1.Service(config.projectName, {
  metadata: {
    namespace: namespace.metadata.name,
    labels: config.app.labels,
  },
  spec: {
    ports: [
      {
        port: 80,
        targetPort: 8000,
      },
    ],
    selector: config.app.labels,
  },
});

export const serviceHost = pulumi.interpolate`${service.metadata.name}.${namespace.metadata.name}.svc.cluster.local`;
