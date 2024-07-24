import * as aws from '@pulumi/aws';
import * as config from './config';

const managedPolicyArnsNodeGroup: string[] = [
  'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
  'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
  'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
];

const managedPolicyArnsEks: string[] = [
  'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
  'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
  'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess',
  'arn:aws:iam::aws:policy/AmazonAPIGatewayInvokeFullAccess',
  'arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator',
];

const roleEks = new aws.iam.Role(`roleeks-${config.environment}`, {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: 'eks.amazonaws.com',
  }),
  tags: config.tags,
});

const roleNodeGroup = new aws.iam.Role(`nodegroup-${config.environment}`, {
  assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
    Service: 'ec2.amazonaws.com',
  }),
  tags: config.tags,
});

const roleClusterAdmin = new aws.iam.Role(`eks-cluster-admin-${config.environment}`, {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: '',
        Effect: 'Allow',
        Principal: {
          AWS: `arn:aws:iam::${config.awsAccountId}:root`,
        },
        Action: 'sts:AssumeRole',
      },
    ],
  }),
  tags: { clusterAccess: `eks-cluster-admin-${config.environment}`, ...config.tags },
});

let counter = 0;
for (const policy of managedPolicyArnsEks) {
  new aws.iam.RolePolicyAttachment(`eks-policy-${config.environment}-${counter++}`, {
    policyArn: policy,
    role: roleEks,
  });
}

counter = 0;
for (const policy of managedPolicyArnsNodeGroup) {
  new aws.iam.RolePolicyAttachment(`nodegroup-policy-${config.environment}-${counter++}`, { policyArn: policy, role: roleNodeGroup });
}

const eksAsgAccessPolicy = new aws.iam.Policy(`eks-asg-access-${config.environment}`, {
  name: `eks-asg-access-${config.environment}`,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: [
          'autoscaling:DescribeAutoScalingGroups',
          'autoscaling:DescribeAutoScalingInstances',
          'autoscaling:DescribeLaunchConfigurations',
          'autoscaling:DescribeTags',
          'autoscaling:SetDesiredCapacity',
          'autoscaling:TerminateInstanceInAutoScalingGroup',
          'ec2:DescribeLaunchTemplateVersions',
        ],
        Resource: '*',
        Effect: 'Allow',
      },
    ],
  }),
  tags: config.tags,
});
new aws.iam.RolePolicyAttachment(`nodegroup-policy-asg-${config.environment}`, { policyArn: eksAsgAccessPolicy.arn, role: roleNodeGroup });

const instanceProfileNodeCluster = new aws.iam.InstanceProfile(`node-${config.environment}`, { role: roleNodeGroup });

export { roleEks, roleNodeGroup, instanceProfileNodeCluster, roleClusterAdmin };
