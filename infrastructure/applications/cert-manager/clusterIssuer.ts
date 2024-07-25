import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import { chart } from './chart';

new k8s.apiextensions.CustomResource(
  config.projectName,
  {
    apiVersion: 'cert-manager.io/v1',
    kind: 'ClusterIssuer',
    metadata: {
      name: 'letsencrypt',
    },
    spec: {
      acme: {
        server: 'https://acme-v02.api.letsencrypt.org/directory',
        email: 'barreramelchorf@gmail.com',
        privateKeySecretRef: {
          name: 'letsencrypt',
        },
        solvers: [
          {
            dns01: {
              route53: {
                region: 'us-east-1',
              },
            },
            selector: {},
          },
        ],
      },
    },
  },
  { dependsOn: [chart] },
);
