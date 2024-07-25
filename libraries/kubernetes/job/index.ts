import * as k8s from '@pulumi/kubernetes';
import * as globalConfig from '../../../config/standard';
import { input as inputs } from '@pulumi/kubernetes/types';
import * as pulumi from '@pulumi/pulumi';

export const Job = (
  labels: {
    [key: string]: string;
  },
  namespace: k8s.core.v1.Namespace | string,
  store?: string | undefined,
  specs?: inputs.batch.v1.JobSpec,
  opts?: pulumi.CustomResourceOptions,
): void => {
  new k8s.batch.v1.Job(
    `${globalConfig.projectName}${store ? `-${store}` : ''}`,
    {
      metadata: {
        namespace: typeof namespace === 'string' ? namespace : namespace.metadata.name,
        labels: labels,
      },
      spec: specs,
    },
    opts,
  );
};

export function getJobSpec(cron: k8s.batch.v1.CronJob): k8s.types.input.batch.v1.JobSpec {
  const jobSpec: k8s.types.input.batch.v1.JobSpec = {
    template: cron.spec.jobTemplate.spec.template,
    parallelism: 1, // Set the number of parallel jobs to 1
  };

  return jobSpec;
}
