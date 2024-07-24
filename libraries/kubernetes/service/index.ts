import * as k8s from '@pulumi/kubernetes';
import * as globalConfig from '../../../config/standard';
import { input as inputs } from '@pulumi/kubernetes/types';
import * as pulumi from '@pulumi/pulumi';

export const Service = (
  labels: {
    [key: string]: string;
  },
  namespace: k8s.core.v1.Namespace | string,
  port = 80,
  targetPort = 8080,
  store?: string | undefined,
  specArgs?: inputs.core.v1.ServiceSpec,
  opts?: pulumi.CustomResourceOptions
): k8s.core.v1.Service => {
  return new k8s.core.v1.Service(
    `${globalConfig.projectName}${store ? `-${store}` : ''}`,
    {
      metadata: {
        namespace: typeof namespace === 'string' ? namespace : namespace.metadata.name,
        labels: labels,
      },
      spec: {
        ports: [
          {
            port: port,
            targetPort: targetPort,
          },
        ],
        selector: labels,
        ...specArgs,
      },
    },
    opts
  );
};
