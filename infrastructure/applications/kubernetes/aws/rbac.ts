import * as k8s from '@pulumi/kubernetes';

export const buildRbacs = (provider: k8s.Provider, cluster: string) => {
  new k8s.rbac.v1.ClusterRole(
    `${cluster}-cluster-admin-role`,
    {
      metadata: {
        name: 'cluster-admin-role',
      },
      rules: [
        {
          apiGroups: ['*'],
          resources: ['*'],
          verbs: ['*'],
        },
      ],
    },
    { provider: provider }
  );

  new k8s.rbac.v1.ClusterRoleBinding(
    `${cluster}-cluster-admin-binding`,
    {
      metadata: {
        name: 'cluster-admin-binding',
      },
      subjects: [
        {
          kind: 'User',
          name: 'cluster-admin',
        },
      ],
      roleRef: {
        kind: 'ClusterRole',
        name: 'cluster-admin-role',
        apiGroup: 'rbac.authorization.k8s.io',
      },
    },
    { provider: provider }
  );

  new k8s.rbac.v1.ClusterRole(
    `${cluster}-cluster-read-only-role`,
    {
      metadata: {
        name: 'cluster-read-only-role',
      },
      rules: [
        {
          apiGroups: ['*'],
          resources: ['*'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    },
    { provider: provider }
  );

  new k8s.rbac.v1.ClusterRoleBinding(
    `${cluster}-cluster-read-only-binding`,
    {
      metadata: {
        name: 'cluster-read-only-binding',
      },
      subjects: [
        {
          kind: 'Group',
          name: 'cluster-read-only',
        },
      ],
      roleRef: {
        kind: 'ClusterRole',
        name: 'cluster-read-only-role',
        apiGroup: 'rbac.authorization.k8s.io',
      },
    },
    { provider: provider }
  );
};
