import * as pulumi from '@pulumi/pulumi';
import * as k8s from '@pulumi/kubernetes';

interface ResourceValues {
  min?: string;
  max: string;
}

export interface ResourceLimitsArgs {
  namespace: pulumi.Output<string>;
  labels: { [key: string]: string };
  containers: {
    resources: {
      cpu: ResourceValues;
      memory: ResourceValues;
    };
  };
  maximumPods: number;
}

export class ResourceLimits extends pulumi.ComponentResource {
  constructor(projectName: string, args: ResourceLimitsArgs, opts?: pulumi.ComponentResourceOptions) {
    super('kubernetes:ResourceLimits', projectName, {}, { ...opts });

    const regex = /\d+/g;
    const cpuMax = args.containers.resources.cpu.max.match(regex);
    const cpuMedium = Number(cpuMax) / 2;
    const cpuLimit = Number(cpuMax) * args.maximumPods;
    const memoryMax = args.containers.resources.memory.max.match(regex);
    const memoryMedium = Number(memoryMax) / 2;
    const memoryLimit = Number(memoryMax) * args.maximumPods;
    const cpuUnit = args.containers.resources.cpu.max.substr(cpuMax?.[0].length ?? 0);
    const memoryUnit = args.containers.resources.memory.max.substr(memoryMax?.[0].length ?? 0);

    new k8s.core.v1.ResourceQuota(
      projectName,
      {
        metadata: {
          namespace: args.namespace,
          labels: args.labels,
        },
        spec: {
          hard: {
            'requests.cpu': String(cpuLimit / 2).concat(cpuUnit),
            'requests.memory': String(memoryLimit / 2).concat(memoryUnit),
            pods: String(args.maximumPods),
            'limits.cpu': String(cpuLimit).concat(cpuUnit),
            'limits.memory': String(memoryLimit).concat(memoryUnit),
          },
        },
      },
      {
        parent: this,
      }
    );

    new k8s.core.v1.LimitRange(
      projectName,
      {
        metadata: {
          namespace: args.namespace,
          labels: args.labels,
        },
        spec: {
          limits: [
            {
              type: 'Container',
              default: {
                cpu: String(cpuMedium).concat(cpuUnit),
                memory: String(memoryMedium).concat(memoryUnit),
              },
              defaultRequest: {
                cpu: String(cpuMedium).concat(cpuUnit),
                memory: String(memoryMedium).concat(memoryUnit),
              },
              min: {
                cpu: args.containers.resources.cpu.min ?? '10m',
                memory: args.containers.resources.memory.min ?? '10Mi',
              },
              max: {
                cpu: args.containers.resources.cpu.max,
                memory: args.containers.resources.memory.max,
              },
            },
          ],
        },
      },
      {
        parent: this,
      }
    );
  }
}
