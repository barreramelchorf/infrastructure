export default interface Config {
  domain: string;
  domains: {
    [domain: string]: {
      domain: string;
      zoneId: string;
    };
  };
  hostedZones: string[];
  certificateArn: string;
  aws: {
    vpcId: string;
    network: {
      globalCidr: string;
    };
  };
}
