import * as k8s from '@pulumi/kubernetes';
import * as globalConfig from '../../../config/standard';
import { input as inputs } from '@pulumi/kubernetes/types';
import * as pulumi from '@pulumi/pulumi';

export const PodDisruptionBudget = (
  labels: {
    [key: string]: string;
  },
  namespace: k8s.core.v1.Namespace | string,
  store?: string | undefined,
  specs?: inputs.policy.v1.PodDisruptionBudgetSpec,
  opts?: pulumi.CustomResourceOptions,
): void => {
  type Replicas = {
    deployment: {
      replicas: {
        min: number;
      };
    };
  };
  const minReplicas = globalConfig.project.getObject<Replicas>('app')?.deployment?.replicas?.min;
  if (minReplicas && minReplicas < 2) {
    return;
  }
  new k8s.policy.v1.PodDisruptionBudget(
    `${globalConfig.projectName}${store ? `-${store}` : ''}`,
    {
      metadata: {
        namespace: typeof namespace === 'string' ? namespace : namespace.metadata.name,
        labels: labels,
      },
      spec: {
        minAvailable: '50%',
        selector: {
          matchLabels: labels,
        },
      },
      ...specs,
    },
    opts
  );
};
