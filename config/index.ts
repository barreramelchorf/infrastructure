import * as staging from './staging';
import Config from './config';

export function getSharedConfig(stack: string): Config {
  switch (stack) {
    case 'staging':
      return staging.config;
    case 'all':
    case 'global':
      /* eslint-disable @typescript-eslint/explicit-member-accessibility */
      return new (class implements Config {
        aws: { vpcId: string; network: { globalCidr: string } };
        certificateArn: string;
        domain: string;
        domains: { [p: string]: { domain: string; zoneId: string } };
        hostedZones: string[];
      })();

    default:
      throw new Error(`Stack "${stack}" does not exist: could not load variables`);
  }
}

export default getSharedConfig;
