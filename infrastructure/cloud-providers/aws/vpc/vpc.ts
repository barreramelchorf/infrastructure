import * as aws from '@pulumi/aws';
import * as config from './config';

const availabilityZones: { [key: string]: string } = {
  a: 'use1-az4',
  b: 'use1-az6',
  c: 'use1-az1',
  d: 'use1-az2',
};

const createSubnet = (name: string, cidrBlock: string, assignIpv6AddressOnCreation: boolean, availabilityZoneId: string, vpc: aws.ec2.Vpc) =>
  new aws.ec2.Subnet(name, {
    vpcId: vpc.id,
    cidrBlock,
    mapPublicIpOnLaunch: assignIpv6AddressOnCreation,
    availabilityZoneId: availabilityZoneId,
    tags: {
      Name: name,
    },
  });

Object.keys(config.vpcConfig).forEach((netowrkConfig) => {
  console.log(config.vpcConfig[netowrkConfig].subnets);
  //Filter just selected availability zones
  const az = Object.fromEntries(config.vpcConfig[netowrkConfig].availabilityZones.map((zone) => [zone, availabilityZones[zone]]));
  let vpc: aws.ec2.Vpc;
  let igw: aws.ec2.InternetGateway;
  // Create a VPC or use existing one
  if (config.vpcConfig[netowrkConfig].vpcConfig) {
    vpc = new aws.ec2.Vpc(`${config.projectName}-${config.environment}-${netowrkConfig}-vpc`, {
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        Name: `${config.projectName}-${config.environment}-${netowrkConfig}`,
      },
      ...config.vpcConfig[netowrkConfig].vpcConfig,
    });
    igw = new aws.ec2.InternetGateway(`${config.projectName}-${config.environment}-${netowrkConfig}-igw`, {
      vpcId: vpc.id,
    });
  } else if (config.vpcConfig[netowrkConfig].vpc) {
    vpc = aws.ec2.Vpc.get(`${config.projectName}-${config.environment}-${netowrkConfig}-vpc`, config.vpcConfig[netowrkConfig].vpc!.id);
    igw = aws.ec2.InternetGateway.get(`${config.projectName}-${config.environment}-${netowrkConfig}-igw`, config.vpcConfig[netowrkConfig].vpc!.internetGateway);
  } else if (config.vpcConfig[netowrkConfig].vpcConfig && config.vpcConfig[netowrkConfig].vpc) {
    throw new Error('You cannot provide both vpcConfig and vpc values');
  } else {
    throw new Error('You need to provide either vpcConfig or vpc values');
  }

  // Create public subnets
  const publicSubnets = Object.entries(config.vpcConfig[netowrkConfig].subnets.public).flatMap(([zone, cidrs]) =>
    cidrs.map((cidr, index) =>
      createSubnet(`${config.projectName}-${config.environment}-${netowrkConfig}-public-az-${zone}${index > 0 ? `-${index + 1}` : ''}`, cidr, true, az[zone], vpc),
    ),
  );

  // Create private subnets
  const privateSubnets = Object.entries(config.vpcConfig[netowrkConfig].subnets.private).flatMap(([zone, cidrs]) =>
    cidrs.map((cidr, index) =>
      createSubnet(`${config.projectName}-${config.environment}-${netowrkConfig}-private-az-${zone}${index > 0 ? `-${index + 1}` : ''}`, cidr, true, az[zone], vpc),
    ),
  );

  // Create NAT Gateway
  const eip = new aws.ec2.Eip(`${config.projectName}-${config.environment}-${netowrkConfig}-eip`, {
    vpc: true,
  });

  const natgw = new aws.ec2.NatGateway(`${config.projectName}-${config.environment}-${netowrkConfig}-ngw`, {
    allocationId: eip.id,
    subnetId: publicSubnets[0].id, // We'll place it in the first public subnet
    tags: {
      Name: `${config.projectName}-${config.environment}-${netowrkConfig}-ngw`,
    },
  });

  // Create a new Route Table
  const routeTablePrivate = new aws.ec2.RouteTable(`${config.projectName}-${config.environment}-${netowrkConfig}-routeTable-private`, {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: config.vpcConfig[netowrkConfig].routeTable.private.cidrBlock,
        natGatewayId: natgw.id,
      },
      ...(config.vpcConfig[netowrkConfig].routeTable.private.routes ?? []), // Use nullish coalescing operator to handle null/undefined routes
    ],
    tags: {
      Name: `${config.projectName}-${config.environment}-${netowrkConfig}-routeTable-private`,
    },
  });

  const routeTablePublic = new aws.ec2.RouteTable(`${config.projectName}-${config.environment}-${netowrkConfig}-routeTable-public`, {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: config.vpcConfig[netowrkConfig].routeTable.public.cidrBlock,
        gatewayId: igw.id,
      },
      ...(config.vpcConfig[netowrkConfig].routeTable.public.routes ?? []), // Use nullish coalescing operator to handle null/undefined routes
    ],
    tags: {
      Name: `${config.projectName}-${config.environment}-${netowrkConfig}-routeTable-public`,
    },
  });

  // Associate Route table with subnets.
  publicSubnets.forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`${config.projectName}-${config.environment}-${netowrkConfig}-routeTableAssoc-public-${Object.keys(az)[i]}`, {
      subnetId: subnet.id,
      routeTableId: routeTablePublic.id,
    });
  });

  privateSubnets.forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`${config.projectName}-${config.environment}-${netowrkConfig}-routeTableAssoc-private-${Object.keys(az)[i]}`, {
      subnetId: subnet.id,
      routeTableId: routeTablePrivate.id,
    });
  });
  if (config.vpcConfig[netowrkConfig].peerings) {
    Object.keys(config.vpcConfig[netowrkConfig].peerings!).forEach((peering) => {
      // Create VPC Peering Connection
      const vpcPeering = new aws.ec2.VpcPeeringConnection(`${config.projectName}-${config.environment}-${netowrkConfig}-vpcPeering`, {
        vpcId: vpc.id,
        peerVpcId: peering,
        autoAccept: true,
        tags: {
          Name: `${config.projectName}-${config.environment}-${netowrkConfig}-peering`,
        },
      });

      //Route for peering
      new aws.ec2.Route(`${config.projectName}-${config.environment}-${netowrkConfig}-route-public`, {
        routeTableId: routeTablePublic.id, // The ID of the routing table
        destinationCidrBlock: config.vpcConfig[netowrkConfig].peerings![peering].publicDestinationCidrBlock,
        vpcPeeringConnectionId: vpcPeering.id, // The ID of the VPC peering connection
      });

      new aws.ec2.Route(`${config.projectName}-${config.environment}-${netowrkConfig}-route-private`, {
        routeTableId: routeTablePrivate.id, // The ID of the routing table
        destinationCidrBlock: config.vpcConfig[netowrkConfig].peerings![peering].privateDestinationCidrBlock,
        vpcPeeringConnectionId: vpcPeering.id, // The ID of the VPC peering connection
      });
    });
  }
});
