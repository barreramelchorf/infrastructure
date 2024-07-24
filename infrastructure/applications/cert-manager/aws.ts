import * as aws from '@pulumi/aws';
import * as config from './config';

const user = new aws.iam.User(config.projectName, {
  name: `${config.stack}-cert-manager`,
});

export const accessKey = new aws.iam.AccessKey(config.projectName, {
  user: user.name,
});

const iamPolicy = new aws.iam.Policy(config.projectName, {
  name: `${config.stack}-cert-manager`,
  description: 'Allow EKS to interact with Route53 via cert-manager',
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 'route53:GetChange',
        Resource: 'arn:aws:route53:::change/*',
      },
      {
        Effect: 'Allow',
        Action: 'route53:ChangeResourceRecordSets',
        Resource: config.shared.hostedZones,
      },
      {
        Effect: 'Allow',
        Action: 'route53:ListHostedZonesByName',
        Resource: '*',
      },
    ],
  }),
});

new aws.iam.PolicyAttachment(config.projectName, {
  name: `${config.stack}-cert-manager`,
  users: [user],
  policyArn: iamPolicy.arn,
});
