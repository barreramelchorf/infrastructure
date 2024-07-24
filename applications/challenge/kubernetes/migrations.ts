import * as k8s from '@pulumi/kubernetes';
import { namespace } from './namespace';
import * as config from './config';
import { envVars } from './envVars';
import { isReviewApp } from '../../../libraries/reviewApps';
import { envs } from '../../../libraries/datadog';

const labels = {
  ...config.app.labels,
  'app.kubernetes.io/component': 'migrations',
};

export let migrations: k8s.batch.v1.Job;
if (!isReviewApp()) {
  migrations = new k8s.batch.v1.Job(
    'migrations',
    {
      metadata: {
        namespace: namespace.metadata.name,
        labels: labels,
      },
      spec: {
        backoffLimit: 0,
        template: {
          metadata: {
            annotations: {
              'linkerd.io/inject': 'disabled',
              'ad.datadoghq.com/python.logs': JSON.stringify([{ source: 'migrations', service: config.projectName }]),
            },
            labels: labels,
          },
          spec: {
            restartPolicy: 'Never',
            containers: [
              {
                name: 'python',
                image: `${config.app.imageRepository}/${config.projectName}:${config.app.migrationsVersion}`,
                imagePullPolicy: 'Always',
                command: ['python', 'manage.py', 'migrate'],
                env: [
                  {
                    name: 'DD_SERVICE',
                    value: config.projectName,
                  },
                  {
                    name: 'DD_VERSION',
                    value: `${config.app.version}`,
                  },
                  {
                    name: 'DD_TRACE_ANALYTICS_ENABLED',
                    value: 'false',
                  },
                  {
                    name: 'DD_SYMFONY_ANALYTICS_ENABLED',
                    value: 'false',
                  },
                  {
                    name: 'DD_PDO_ANALYTICS_ENABLED',
                    value: 'false',
                  },
                ],
                envFrom: [
                  {
                    configMapRef: {
                      name: envVars.metadata.name,
                    },
                  },
                ],
                resources: config.app.deployment.containers.python.resources,
              },
            ],
            nodeSelector: {
              'node.k8s.k8s.com/name': 'general',
            },
          },
        },
      },
    },
    {
      customTimeouts: {
        create: '1h', // Allow migrations to run for an hour
      },
    }
  );
}
