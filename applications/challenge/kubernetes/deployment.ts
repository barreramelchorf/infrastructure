import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import { namespace } from './namespace';
import { envVars } from './envVars';
import { annotations, envs } from '../../../libraries/datadog';
import { isReviewApp } from '../../../libraries/reviewApps';
import { DefaultSecurityContext } from '../../../libraries/types/app/kubernetes/partials/defaultSecurityContext';
import * as labels from '../../../libraries/labels';
import {database} from '../aws/database';

export const Deployment = () =>
  new k8s.apps.v1.Deployment(config.projectName, {
    metadata: {
      namespace: namespace.metadata.name,
      labels: config.app.labels,
    },
    spec: {
      selector: {
        matchLabels: config.app.labels,
      },
      template: {
        metadata: {
          labels: config.app.labels,
          annotations: {
            ...new annotations.DatadogAnnotations(config.projectName).withLogs(config.projectName, 'python').output(),
          },
        },
        spec: {
          containers: [
            {
              name: 'python',
              image: `${config.app.imageRepository}/${config.projectName}:${config.app.version}`,
              imagePullPolicy: 'Always',
              command: ["python","manage.py","runserver","0.0.0.0:8000"],
              envFrom: [
                {
                  configMapRef: {
                    name: envVars.metadata.name,
                  },
                },
              ],
              ports: [
                {
                  containerPort: 8000,
                },
              ],
              readinessProbe: {
                tcpSocket: {
                  port: 8000,
                },
                initialDelaySeconds: 2,
                timeoutSeconds: 2,
                periodSeconds: 10,
              },
              // volumeMounts: DefaultSecurityContext.nginx({ phpFpmEnabled: true }).volumeMounts,
              // securityContext: DefaultSecurityContext.nginx({ phpFpmEnabled: true }).securityContext,
              resources: config.app.deployment.containers.python.resources,
            },
          ],
          // volumes: [
          //   ...DefaultSecurityContext.nginx({ phpFpmEnabled: true }).volumes,
          // ],
          nodeSelector: {
            'node.k8s.k8s.com/name': 'general',
          },
          affinity: {
            podAntiAffinity: {
              preferredDuringSchedulingIgnoredDuringExecution: [
                {
                  podAffinityTerm: {
                    labelSelector: {
                      matchExpressions: [
                        {
                          key: 'app.kubernetes.io/name',
                          operator: 'In',
                          values: [config.projectName],
                        },
                        {
                          key: 'app.kubernetes.io/component',
                          operator: 'In',
                          values: [labels.Components.API],
                        },
                      ],
                    },
                    topologyKey: 'kubernetes.io/zone',
                  },
                  weight: 100,
                },
              ],
            },
          },
        },
      },
    },
  },
{
  dependsOn: [database]
});
