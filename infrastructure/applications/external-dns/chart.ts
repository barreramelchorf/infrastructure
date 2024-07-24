import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import * as aws from './aws';
import { namespace } from './namespace';
import * as pulumi from '@pulumi/pulumi';

console.log(pulumi.getStack());
new k8s.helm.v3.Chart(config.projectName, {
  chart: 'external-dns',
  version: config.project.require('chartVersion'),
  fetchOpts: {
    repo: 'https://charts.bitnami.com/bitnami',
  },
  namespace: namespace.metadata.name,
  values: {
    provider: 'aws',
    sources: ['service', 'ingress'],
    domainFilters: Object.keys(config.shared.domains),
    txtOwnerId: pulumi.getStack(),
    txtPrefix: 'external-dns.',
    policy: config.project.require('policy'),
    aws: {
      credentials: {
        accessKey: aws.awsAccessKey.id,
        secretKey: aws.awsAccessKey.secret,
      },
      region: config.aws.require('region'),
      zoneType: 'public',
      batchChangeSize: 500,
    },
    interval: config.project.require('interval'),
    triggerLoopOnEvent: true,
    rbac: {
      create: true,
      apiVersion: 'v1',
    },
    resources: {
      requests: {
        cpu: '10m',
        memory: '128Mi',
      },
      limits: {
        cpu: '50m',
        memory: '256Mi',
      },
    },
  },
});
