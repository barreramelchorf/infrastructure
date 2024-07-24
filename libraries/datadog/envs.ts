import * as k8s from '@pulumi/kubernetes';

export const CentralAPM = (environment: string): k8s.types.input.core.v1.EnvVar[] => {
  return [
    {
      name: 'DD_AGENT_HOST',
      valueFrom: {
        fieldRef: {
          fieldPath: 'status.hostIP',
        },
      },
    },
    {
      name: 'DD_TRACE_SAMPLE_RATE',
      value: '0.05',
    },
    {
      name: 'DD_ENV',
      value: environment,
    },
  ];
};
