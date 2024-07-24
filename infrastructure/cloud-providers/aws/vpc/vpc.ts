import * as aws from '@pulumi/aws';
import * as config from './config';

interface VpcConf {
  [name: string]: {
    vpc: aws.ec2.Vpc,
    publicSubnets: aws.ec2.Subnet[],
    privateSubnets: aws.ec2.Subnet[]
  }
}

let vpcConf: VpcConf = {};

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

Object.keys(config.vpcConfig).forEach((networkConfig) => {
  // Initialize vpcConf entry
  vpcConf[networkConfig] = {
    vpc: undefined!, // Initialize vpc as undefined for now
    publicSubnets: [],
    privateSubnets: [],
  };

  // Filter just selected availability zones
  const az = Object.fromEntries(config.vpcConfig[networkConfig].availabilityZones.map((zone) => [zone, availabilityZones[zone]]));
  let vpc: aws.ec2.Vpc;
  let igw: aws.ec2.InternetGateway;
  // Create a VPC or use an existing one
  if (config.vpcConfig[networkConfig].vpcConfig) {
    vpc = new aws.ec2.Vpc(`${config.projectName}-${config.environment}-${networkConfig}-vpc`, {
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        Name: `${config.projectName}-${config.environment}-${networkConfig}`,
      },
      ...config.vpcConfig[networkConfig].vpcConfig,
    });
    igw = new aws.ec2.InternetGateway(`${config.projectName}-${config.environment}-${networkConfig}-igw`, {
      vpcId: vpc.id,
    });
    vpcConf[networkConfig].vpc = vpc; // Assign vpc to vpcConf
  } else if (config.vpcConfig[networkConfig].vpc) {
    vpc = aws.ec2.Vpc.get(`${config.projectName}-${config.environment}-${networkConfig}-vpc`, config.vpcConfig[networkConfig].vpc!.id);
    igw = aws.ec2.InternetGateway.get(`${config.projectName}-${config.environment}-${networkConfig}-igw`, config.vpcConfig[networkConfig].vpc!.internetGateway);
    vpcConf[networkConfig].vpc = vpc; // Assign vpc to vpcConf
  } else if (config.vpcConfig[networkConfig].vpcConfig && config.vpcConfig[networkConfig].vpc) {
    throw new Error('You cannot provide both vpcConfig and vpc values');
  } else {
    throw new Error('You need to provide either vpcConfig or vpc values');
  }

  // Create public subnets
  const publicSubnets = Object.entries(config.vpcConfig[networkConfig].subnets.public).flatMap(([zone, cidrs]) =>
    cidrs.map((cidr, index) =>
      createSubnet(`${config.projectName}-${config.environment}-${networkConfig}-public-az-${zone}${index > 0 ? `-${index + 1}` : ''}`, cidr, true, az[zone], vpc),
    ),
  );

  // Create private subnets
  const privateSubnets = Object.entries(config.vpcConfig[networkConfig].subnets.private).flatMap(([zone, cidrs]) =>
    cidrs.map((cidr, index) =>
      createSubnet(`${config.projectName}-${config.environment}-${networkConfig}-private-az-${zone}${index > 0 ? `-${index + 1}` : ''}`, cidr, true, az[zone], vpc),
    ),
  );

  // Assign subnets to vpcConf
  vpcConf[networkConfig].publicSubnets = publicSubnets;
  vpcConf[networkConfig].privateSubnets = privateSubnets;

  // Create NAT Gateway
  const eip = new aws.ec2.Eip(`${config.projectName}-${config.environment}-${networkConfig}-eip`, {
    vpc: true,
  });

  const natgw = new aws.ec2.NatGateway(`${config.projectName}-${config.environment}-${networkConfig}-ngw`, {
    allocationId: eip.id,
    subnetId: publicSubnets[0].id, // Place it in the first public subnet
    tags: {
      Name: `${config.projectName}-${config.environment}-${networkConfig}-ngw`,
    },
  });

  // Create a new Route Table
  const routeTablePrivate = new aws.ec2.RouteTable(`${config.projectName}-${config.environment}-${networkConfig}-routeTable-private`, {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: config.vpcConfig[networkConfig].routeTable.private.cidrBlock,
        natGatewayId: natgw.id,
      },
      ...(config.vpcConfig[networkConfig].routeTable.private.routes ?? []), // Use nullish coalescing operator to handle null/undefined routes
    ],
    tags: {
      Name: `${config.projectName}-${config.environment}-${networkConfig}-routeTable-private`,
    },
  });

  const routeTablePublic = new aws.ec2.RouteTable(`${config.projectName}-${config.environment}-${networkConfig}-routeTable-public`, {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: config.vpcConfig[networkConfig].routeTable.public.cidrBlock,
        gatewayId: igw.id,
      },
      ...(config.vpcConfig[networkConfig].routeTable.public.routes ?? []), // Use nullish coalescing operator to handle null/undefined routes
    ],
    tags: {
      Name: `${config.projectName}-${config.environment}-${networkConfig}-routeTable-public`,
    },
  });

  // Associate Route table with subnets
  publicSubnets.forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`${config.projectName}-${config.environment}-${networkConfig}-routeTableAssoc-public-${Object.keys(az)[i]}`, {
      subnetId: subnet.id,
      routeTableId: routeTablePublic.id,
    });
  });

  privateSubnets.forEach((subnet, i) => {
    new aws.ec2.RouteTableAssociation(`${config.projectName}-${config.environment}-${networkConfig}-routeTableAssoc-private-${Object.keys(az)[i]}`, {
      subnetId: subnet.id,
      routeTableId: routeTablePrivate.id,
    });
  });

  // Handle VPC peerings if configured
  if (config.vpcConfig[networkConfig].peerings) {
    Object.keys(config.vpcConfig[networkConfig].peerings!).forEach((peering) => {
      // Create VPC Peering Connection
      const vpcPeering = new aws.ec2.VpcPeeringConnection(`${config.projectName}-${config.environment}-${networkConfig}-vpcPeering`, {
        vpcId: vpc.id,
        peerVpcId: peering,
        autoAccept: true,
        tags: {
          Name: `${config.projectName}-${config.environment}-${networkConfig}-peering`,
        },
      });

      // Route for peering
      new aws.ec2.Route(`${config.projectName}-${config.environment}-${networkConfig}-route-public`, {
        routeTableId: routeTablePublic.id,
        destinationCidrBlock: config.vpcConfig[networkConfig].peerings![peering].publicDestinationCidrBlock,
        vpcPeeringConnectionId: vpcPeering.id,
      });

      new aws.ec2.Route(`${config.projectName}-${config.environment}-${networkConfig}-route-private`, {
        routeTableId: routeTablePrivate.id,
        destinationCidrBlock: config.vpcConfig[networkConfig].peerings![peering].privateDestinationCidrBlock,
        vpcPeeringConnectionId: vpcPeering.id,
      });
    });
  }
});

export { vpcConf };
