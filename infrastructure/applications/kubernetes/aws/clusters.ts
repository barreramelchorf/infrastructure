import * as awsEks from '@pulumi/eks';
import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import { roleEks, roleNodeGroup, roleClusterAdmin, instanceProfileNodeCluster } from './iamRole';
import { buildRbacs } from './rbac';

const clusters: { [name: string]: k8s.Provider } = {};

config.clusters.forEach((eks) => {
  const clusterName = `${eks.name}-cluster-${config.environment}`;
  const cluster = new awsEks.Cluster(
    clusterName,
    {
      name: clusterName,
      version: eks.version,
      skipDefaultNodeGroup: true,
      privateSubnetIds: eks.vpcPrivateSubnetsIds,
      publicSubnetIds: eks.vpcPublicSubnetsIds,
      vpcId: eks.vpcId,
      instanceRoles: [roleEks, roleNodeGroup],
      nodeAssociatePublicIpAddress: false,
      tags: { ...config.tags, Name: clusterName },
      roleMappings: [
        {
          groups: ['system:masters'],
          roleArn: roleClusterAdmin.arn,
          username: 'cluster-admin',
        },
      ],
      userMappings: config.users.map((user) => ({
        groups: [user.group],
        username: user.username,
        userArn: user.arn,
      })),
    },
    {
      protect: false,
      dependsOn: [instanceProfileNodeCluster, roleEks, roleNodeGroup],
    }
  );

  clusters[eks.name] = cluster.provider;
  const clusterNameTags = cluster.core.cluster.name;

  eks.nodes.forEach((node) => {
    new awsEks.NodeGroupV2(
      `${node.name}-${config.environment}`,
      {
        cluster: cluster,
        nodeRootVolumeSize: node.size,
        nodeAssociatePublicIpAddress: false,
        nodeSubnetIds: [...eks.vpcPrivateSubnetsIds],
        instanceType: node.instanceType,
        desiredCapacity: node.desiredCapacity,
        minSize: node.minSize,
        maxSize: node.maxSize,
        version: eks.version,
        spotPrice: node.spot ? '1' : undefined,
        instanceProfile: instanceProfileNodeCluster,
        kubeletExtraArgs: '--cluster-dns=169.254.20.10',
        labels: {
          'node.k8s.k8s.com/name': node.labelName,
        },
        autoScalingGroupTags: clusterNameTags.apply((clusterNameTags) => ({
          ...config.tags,
          CloudFormationGroupTag: 'true',
          'k8s.io/cluster-autoscaler/enabled': 'true',
          [`k8s.io/cluster-autoscaler/${clusterNameTags}`]: 'owned',
        })),
      },
      {
        protect: false,
      }
    );
  });

  buildRbacs(cluster.provider, eks.name);
});

export { clusters };
