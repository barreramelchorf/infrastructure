import * as k8s from '@pulumi/kubernetes';
import * as globalConfig from '../../../config/standard';
import { getNamespace } from '../../namespace';
import * as pulumi from '@pulumi/pulumi';
import { NamespaceArgs } from '@pulumi/kubernetes/core/v1/namespace';

export const Namespace = (
  labels: {
    [key: string]: string;
  },
  args?: NamespaceArgs,
  opts?: pulumi.CustomResourceOptions
) => {

  return new k8s.core.v1.Namespace(
    globalConfig.projectName,
    {
      metadata: {
        name: getNamespace(),
        labels: labels,
      },
      ...args,
    },
    opts
  );
};
