import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import { namespace } from './namespace';
import { service } from './service';
import { isReviewApp } from '../../../libraries/reviewApps';

new k8s.networking.v1.Ingress(`${config.projectName}-v4`, {
  metadata: {
    namespace: namespace.metadata.name,
    labels: config.app.labels,
    annotations: {
      'kubernetes.io/tls-acme': `${!isReviewApp() ? 'true' : 'false'}`,
      'nginx.ingress.kubernetes.io/configuration-snippet': 'proxy_set_header l5d-dst-override $service_name.$namespace.svc.cluster.local:$service_port;',
      'nginx.ingress.kubernetes.io/service-upstream': 'true',
      'nginx.ingress.kubernetes.io/proxy-body-size': '10m',
    },
  },
  spec: {
    ingressClassName: `ingress-nginx-${config.app.visibility}`,
    tls: [
      {
        secretName: !isReviewApp() ? `${config.projectName}-v4-certificate` : undefined,
        hosts: [config.app.host],
      },
    ],
    rules: [
      {
        host: config.app.host,
        http: {
          paths: [
            {
              path: '/',
              pathType: 'ImplementationSpecific',
              backend: {
                service: {
                  name: service.metadata.name,
                  port: {
                    number: service.spec.ports[0].port,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
});
