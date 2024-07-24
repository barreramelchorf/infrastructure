import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import * as aws from './aws';
import { namespace } from './namespace';

export const cdrs = new k8s.yaml.ConfigFile(config.projectName, {
  file: `https://github.com/cert-manager/cert-manager/releases/download/${config.project.require('chartVersion')}/cert-manager.crds.yaml`,
});

export const chart = new k8s.helm.v3.Chart(
  config.projectName,
  {
    chart: 'cert-manager',
    version: `${config.project.require('chartVersion')}`,
    fetchOpts: {
      repo: 'https://charts.jetstack.io',
    },
    namespace: namespace.metadata.name,
    values: {
      installCRDs: false,
      ingressShim: {
        defaultIssuerName: 'letsencrypt',
        defaultIssuerKind: 'ClusterIssuer',
        defaultIssuerGroup: 'cert-manager.io',
      },
      extraEnv: [
        {
          name: 'AWS_REGION',
          value: config.aws.require('region'),
        },
        {
          name: 'AWS_ACCESS_KEY_ID',
          value: aws.accessKey.id,
        },
        {
          name: 'AWS_SECRET_ACCESS_KEY',
          value: aws.accessKey.secret,
        },
      ],
      resources: {
        requests: {
          cpu: '10m',
          memory: '64Mi',
        },
        limits: {
          cpu: '100m',
          memory: '256Mi',
        },
      },
      webhook: {
        resources: {
          requests: {
            cpu: '10m',
            memory: '16Mi',
          },
          limits: {
            cpu: '20m',
            memory: '32Mi',
          },
        },
      },
      cainjector: {
        resources: {
          requests: {
            cpu: '10m',
            memory: '32Mi',
          },
          limits: {
            cpu: '100m',
            memory: '128Mi',
          },
        },
      },
    },
  },
  { dependsOn: [namespace, cdrs] }
);
