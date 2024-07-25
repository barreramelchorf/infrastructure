import * as k8s from '@pulumi/kubernetes';
import * as globalConfig from '../../../config/standard';
import { input as inputs } from '@pulumi/kubernetes/types';
import * as pulumi from '@pulumi/pulumi';
import { KubernetesApp } from '../../types/app/kubernetes/app';

export const HorizontalPodAutoscaler = (
  labels: {
    [key: string]: string;
  },
  deployment: k8s.apps.v1.Deployment,
  name?: string,
  specArgs?: inputs.autoscaling.v2.HorizontalPodAutoscalerSpec,
  opts?: pulumi.CustomResourceOptions,
): void => {
  const config = new pulumi.Config();
  const appConfig = config.requireObject<KubernetesApp>('app');
  new k8s.autoscaling.v2.HorizontalPodAutoscaler(
    name ? name : globalConfig.projectName,
    {
      metadata: {
        namespace: deployment.metadata.namespace,
        labels: labels,
      },
      spec: {
        minReplicas: appConfig.deployment.replicas.min,
        maxReplicas: appConfig.deployment.replicas.max,
        scaleTargetRef: {
          apiVersion: deployment.apiVersion,
          kind: deployment.kind,
          name: deployment.metadata.name,
        },
        metrics: [
          {
            type: 'Resource',
            resource: appConfig.deployment?.autoscaling?.memory,
          },
          {
            type: 'Resource',
            resource: appConfig.deployment?.autoscaling?.cpu,
          },
        ],
        ...specArgs,
      },
    },
    opts,
  );
};
