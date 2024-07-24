import Config from './config';

export const config: Config = {
  domain: 'barreramelchorf.top',
  domains: {
    'barreramelchorf.top': {
      domain: 'barreramelchorf.top',
      zoneId: 'Z0042218YUURJEH7KQQJ',
    },
  },
  certificateArn: '',
  hostedZones: ['arn:aws:route53:::hostedzone/Z0042218YUURJEH7KQQJ'],
  aws: {
    vpcId: 'vpc-06675bd318eef3cfc',
    network: {
      globalCidr: '',
    },
  },
};
