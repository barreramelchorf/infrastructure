import * as k8s from '@pulumi/kubernetes';

type Berglas = {
  iniContainer: k8s.types.input.core.v1.Container;
  volumeMonth: k8s.types.input.core.v1.VolumeMount;
  volume: k8s.types.input.core.v1.Volume;
  command: string[];
};

export const berglas: Berglas = {
  iniContainer: {
    name: 'berglas',
    image: 'us-docker.pkg.dev/berglas/berglas/berglas:1.0.3',
    command: ['cp', '/bin/berglas', '/usr/local/berglas/bin/berglas'],
    volumeMounts: [
      {
        name: 'berglas',
        mountPath: '/usr/local/berglas/bin',
      },
    ],
    resources: {
      limits: {
        cpu: '20m',
        memory: '32Mi',
      },
      requests: {
        cpu: '10m',
        memory: '16Mi',
      },
    },
  },
  volumeMonth: {
    name: 'berglas',
    mountPath: '/usr/local/berglas/bin',
  },
  volume: {
    name: 'berglas',
    emptyDir: {},
  },
  command: ['/usr/local/berglas/bin/berglas', 'exec', '--'],
};
