import { core } from '@pulumi/kubernetes/types/input';

interface DefaultSecurityContextSpec {
  volumes: core.v1.Volume[];
  volumeMounts: core.v1.VolumeMount[];
  securityContext: core.v1.SecurityContext;
}

export class DefaultSecurityContext {
  public static nginx(args?: { securityContext?: core.v1.SecurityContext; phpFpmEnabled?: boolean }): DefaultSecurityContextSpec {
    const volumes: core.v1.Volume[] = [
      {
        name: 'tmpfs',
        emptyDir: {},
      },
      {
        name: 'nginx-conf-d',
        emptyDir: {},
      },
      {
        name: 'nginx-status',
        emptyDir: {},
      },
      {
        name: 'nginx-ping',
        emptyDir: {},
      },
      {
        name: 'nginx-cache',
        emptyDir: {},
      },
    ];

    const volumeMounts: core.v1.VolumeMount[] = [
      {
        name: 'tmpfs',
        mountPath: '/tmp',
      },
      {
        name: 'nginx-conf-d',
        mountPath: '/etc/nginx/conf.d',
      },
      {
        name: 'nginx-status',
        mountPath: '/etc/nginx/html/status',
      },
      {
        name: 'nginx-ping',
        mountPath: '/etc/nginx/html/ping',
      },
      {
        name: 'nginx-cache',
        mountPath: '/var/cache/nginx',
      },
    ];

    if (args?.phpFpmEnabled) {
      volumes.push({
        name: 'nginx-php-fpm-status',
        emptyDir: {},
      });
      volumeMounts.push({
        name: 'nginx-php-fpm-status',
        mountPath: '/etc/nginx/partials',
      });
    }

    return {
      securityContext: {
        runAsUser: 101,
        runAsGroup: 101,
        allowPrivilegeEscalation: false,
        readOnlyRootFilesystem: true,
        privileged: false,
        capabilities: {
          drop: ['ALL'],
        },
        ...args?.securityContext,
      },
      volumes: volumes,
      volumeMounts: volumeMounts,
    };
  }

  public static php(securityContext?: core.v1.SecurityContext): DefaultSecurityContextSpec {
    return {
      securityContext: {
        runAsUser: 1000,
        runAsGroup: 2000,
        allowPrivilegeEscalation: false,
        readOnlyRootFilesystem: true,
        privileged: false,
        capabilities: {
          drop: ['ALL'],
        },
        ...securityContext,
      },
      volumes: [
        {
          name: 'tmpfs',
          emptyDir: {},
        },
      ],
      volumeMounts: [
        {
          name: 'tmpfs',
          mountPath: '/tmp',
        },
      ],
    };
  }
}
