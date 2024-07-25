import * as config from './config';
import * as k8s from '@pulumi/kubernetes';
import { namespace } from './namespace';
import * as pulumi from '@pulumi/pulumi';
import * as annotations from '../../../libraries/annotations';
import { envs } from '../../../libraries/datadog';

let extraArgs = {};
if (config.project.getBoolean('reviewAppsEnabled')) {
  const defaultCertificate = new k8s.apiextensions.CustomResource('default-certificate', {
    apiVersion: 'cert-manager.io/v1',
    kind: 'Certificate',
    metadata: {
      namespace: namespace.metadata.name,
    },
    spec: {
      secretName: 'default-certificate',
      issuerRef: {
        name: 'letsencrypt',
        kind: 'ClusterIssuer',
      },
      dnsNames: [`*.reviewapps.${config.shared.domain}`, `*.docs.${config.shared.domain}`],
    },
  });

  extraArgs = {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    'default-ssl-certificate': pulumi.interpolate`${namespace.metadata.name}/${defaultCertificate.spec.secretName}`,
  };
}

new k8s.helm.v3.Chart(
  `${config.projectName}-internal`,
  {
    chart: 'ingress-nginx',
    version: config.nginx.version,
    fetchOpts: {
      repo: 'https://kubernetes.github.io/ingress-nginx',
    },
    namespace: namespace.metadata.name,
    values: {
      controller: {
        allowSnippetAnnotations: true,
        podAnnotations: annotations.linkerdIngressNginxAnnotation('internal'),
        ingressClass: 'ingress-nginx-internal',
        electionID: 'ingress-controller-leader-internal',
        ingressClassResource: {
          name: 'ingress-nginx-internal',
          enabled: true,
          controllerValue: 'k8s.io/ingress-nginx-internal',
        },
        config: {
          'enable-ocsp': 'true',
          'ssl-session-tickets': 'false',
          'http-snippet': `server {
          listen 18080;

          location /nginx_status {
            allow all;
            stub_status on;
          }

          location / {
            return 404;
          }
        }`,
          'enable-opentracing': 'true',
          'datadog-collector-host': '$DD_AGENT_HOST',
          'generate-request-id': 'true',
        },
        autoscaling: {
          enabled: true,
          minReplicas: config.nginx.replicas.min,
          maxReplicas: config.nginx.replicas.max,
          targetMemoryUtilizationPercentage: 75,
          targetCPUUtilizationPercentage: 75,
        },
        extraEnvs: [...envs.CentralAPM(config.environment)],
        extraArgs: extraArgs,
        metrics: {
          enabled: true,
        },
        useComponentLabel: true,
        resources: config.nginx.resources,
        service: {
          externalTrafficPolicy: 'Local',
          annotations: {
            'service.beta.kubernetes.io/aws-load-balancer-backend-protocol': 'tcp',
            'service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled': 'true',
            'service.beta.kubernetes.io/aws-load-balancer-type': 'nlb',
            'service.beta.kubernetes.io/aws-load-balancer-subnets': config.privateSubnets,
            'service.beta.kubernetes.io/aws-load-balancer-internal': 'true',
            'service.beta.kubernetes.io/aws-load-balancer-scheme': 'internal',
            'service.beta.kubernetes.io/load-balancer-name': `${config.projectName}-internal`,
            'service.beta.kubernetes.io/aws-load-balancer-target-group-attributes': 'preserve_client_ip.enabled=false',
          },
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
                        values: ['ingress-nginx'],
                      },
                      {
                        key: 'app.kubernetes.io/instance',
                        operator: 'In',
                        values: [`${config.projectName}-internal`],
                      },
                      {
                        key: 'app.kubernetes.io/component',
                        operator: 'In',
                        values: ['controller'],
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
  {
    dependsOn: [namespace],
  },
);

new k8s.helm.v3.Chart(
  `${config.projectName}-external`,
  {
    chart: 'ingress-nginx',
    version: config.nginx.version,
    fetchOpts: {
      repo: 'https://kubernetes.github.io/ingress-nginx',
    },
    namespace: namespace.metadata.name,
    values: {
      controller: {
        allowSnippetAnnotations: true,
        podAnnotations: annotations.linkerdIngressNginxAnnotation('external'),
        ingressClass: 'ingress-nginx-external',
        electionID: 'ingress-controller-leader-external',
        ingressClassResource: {
          name: 'ingress-nginx-external',
          enabled: true,
          controllerValue: 'k8s.io/ingress-nginx-external',
        },
        config: {
          'enable-ocsp': 'true',
          'ssl-session-tickets': 'false',
          'http-snippet': `server {
          listen 18080;

          location /nginx_status {
            allow all;
            stub_status on;
          }

          location / {
            return 404;
          }
        }`,
          'enable-opentracing': 'true',
          'datadog-collector-host': '$DD_AGENT_HOST',
          'generate-request-id': 'true',
        },
        autoscaling: {
          enabled: true,
          minReplicas: config.nginx.replicas.min,
          maxReplicas: config.nginx.replicas.max,
          targetMemoryUtilizationPercentage: 75,
          targetCPUUtilizationPercentage: 75,
        },
        extraEnvs: [...envs.CentralAPM(config.environment)],
        extraArgs: extraArgs,
        metrics: {
          enabled: true,
        },
        useComponentLabel: true,
        resources: config.nginx.resources,
        service: {
          externalTrafficPolicy: 'Local',
          annotations: {
            'service.beta.kubernetes.io/aws-load-balancer-backend-protocol': 'tcp',
            'service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled': 'true',
            'service.beta.kubernetes.io/aws-load-balancer-type': 'nlb',
            'service.beta.kubernetes.io/aws-load-balancer-subnets': config.publicSubnets,
            'service.beta.kubernetes.io/load-balancer-name': `${config.projectName}-external`,
            'service.beta.kubernetes.io/aws-load-balancer-scheme': 'internet-facing',
          },
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
                        values: ['ingress-nginx'],
                      },
                      {
                        key: 'app.kubernetes.io/instance',
                        operator: 'In',
                        values: [`${config.projectName}-external`],
                      },
                      {
                        key: 'app.kubernetes.io/component',
                        operator: 'In',
                        values: ['controller'],
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
  {
    dependsOn: [namespace],
  },
);
