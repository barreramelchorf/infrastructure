import * as aws from '@pulumi/aws';
import * as config from './config';

const awsUser = new aws.iam.User(config.projectName, {
  name: `eks-${config.stack}-external-dns`,
});

export const awsAccessKey = new aws.iam.AccessKey(config.projectName, {
  user: awsUser.name,
});

const awsIamPolicy = new aws.iam.Policy(config.projectName, {
  name: `eks-${config.stack}-external-dns`,
  description: 'Allow EKS to interact with Route53 via external-dns',
  policy: {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'kopsK8sRoute53Change',
        Effect: 'Allow',
        Action: ['route53:ChangeResourceRecordSets', 'route53:GetHostedZone'],
        Resource: config.shared.hostedZones,
      },
      {
        Effect: 'Allow',
        Action: ['route53:ListHostedZones', 'route53:ListResourceRecordSets'],
        Resource: ['*'],
      },
    ],
  },
});

new aws.iam.PolicyAttachment(config.projectName, {
  name: `eks-${config.stack}-external-dns`,
  users: [awsUser],
  policyArn: awsIamPolicy.arn,
});
