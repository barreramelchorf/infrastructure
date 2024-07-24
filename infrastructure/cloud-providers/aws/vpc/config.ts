import * as config from '../../../../config/standard';
import * as aws from '@pulumi/aws';

export * from '../../../../config/standard';

interface VpcConfig {
  [name: string]: {
    vpc?: {
      id: string;
      internetGateway: string;
    };
    vpcConfig?: aws.ec2.VpcArgs;
    availabilityZones: string[];
    subnets: {
      public: {
        [zone: string]: string[];
      };
      private: {
        [zone: string]: string[];
      };
    };
    routeTable: {
      public: {
        cidrBlock: string;
        routes?: aws.types.input.ec2.RouteTableRoute[];
      };
      private: {
        cidrBlock: string;
        routes?: aws.types.input.ec2.RouteTableRoute[];
      };
    };
    peerings?: {
      [id: string]: {
        publicDestinationCidrBlock: string;
        privateDestinationCidrBlock: string;
      };
    };
  };
}

export const vpcConfig: VpcConfig = config.project.requireObject('networkConfig');
