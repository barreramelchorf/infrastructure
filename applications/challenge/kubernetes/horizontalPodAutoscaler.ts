import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import { namespace } from './namespace';

export const Hpa = (deployment: k8s.apps.v1.Deployment) =>
  new k8s.autoscaling.v2.HorizontalPodAutoscaler(config.projectName, {
    metadata: {
      namespace: namespace.metadata.name,
      labels: config.app.labels,
    },
    spec: {
      minReplicas: config.app.deployment.replicas.min,
      maxReplicas: config.app.deployment.replicas.max,
      scaleTargetRef: {
        apiVersion: deployment.apiVersion,
        kind: deployment.kind,
        name: deployment.metadata.name,
      },
      metrics: [
        {
          type: 'Resource',
          resource: config.app.deployment?.autoscaling?.memory,
        },
        {
          type: 'Resource',
          resource: config.app.deployment?.autoscaling?.cpu,
        },
      ],
    },
  });
