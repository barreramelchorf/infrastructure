import * as k8s from '@pulumi/kubernetes';

export function createDatadogIngress(config: any, service: k8s.core.v1.Service, namespace: k8s.core.v1.Namespace, visibility: string, paths: string[], isReviewApp: () => boolean) {
  const ingress = new k8s.networking.v1.Ingress(`${config.projectName}-datadog`, {
    metadata: {
      namespace: namespace.metadata.name,
      labels: config.app.labels,
      annotations: {
        'kubernetes.io/tls-acme': `${!isReviewApp() ? 'true' : 'false'}`,
        'nginx.ingress.kubernetes.io/service-upstream': 'true',
        'nginx.ingress.kubernetes.io/configuration-snippet': `more_set_headers "Feature-Policy: geolocation 'self'; autoplay 'none'; camera 'none'; microphone 'none'";
        more_set_headers "X-Frame-Options: 'SAMEORIGIN'";
        proxy_set_header X-Forwarded-For $http_x_forwarded_for;   
      `,
      },
    },
    spec: {
      ingressClassName: `ingress-nginx-${visibility}`,
      tls: [
        {
          secretName: !isReviewApp() ? `${config.projectName}-datadog-certificate` : undefined,
          hosts: [config.app.host],
        },
      ],
      rules: [
        {
          host: config.app.host,
          http: {
            paths: paths.map((path) => ({
              path: path,
              pathType: 'ImplementationSpecific',
              backend: {
                service: {
                  name: service.metadata.name,
                  port: {
                    number: service.spec.ports[0].port,
                  },
                },
              },
            })),
          },
        },
      ],
    },
  });

  return ingress;
}
