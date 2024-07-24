import * as aws from '@pulumi/aws';
import * as config from './config';
import { namespace } from '../kubernetes/namespace';
import * as pulumi from '@pulumi/pulumi';
import { isReviewApp } from '../../../libraries/reviewApps';

let database: aws.rds.Instance | pulumi.Output<aws.rds.Instance>;
if (isReviewApp()) {
  const stagingRDatabase = require('../stagingStackReference').apiStaging.getOutput('aws');
  database = stagingRDatabase.apply((aws: { role: { role: aws.iam.Role } }) => aws.role.role);
} else {
  const subnetGroup = new aws.rds.SubnetGroup(`${config.environment}-${config.projectName}`, {
    name: `${config.environment}-${config.projectName}`,
    description: `Subnet for the ${config.projectName}`,
    subnetIds: config.databaseConfig.subnetIds,
    tags: config.tags,
  });
  database = new aws.rds.Instance(`${config.projectName}-database`, {
    instanceClass: config.databaseConfig.instanceClass,
    allocatedStorage: config.databaseConfig.size,
    engine: config.databaseConfig.engine,
    engineVersion: config.databaseConfig.engineVersion,
    dbName: config.projectName,
    username: "fernando",
    password: "fernando123",
    dbSubnetGroupName: subnetGroup.name,
    vpcSecurityGroupIds: [config.securityGroup.id],
    skipFinalSnapshot: true,
});


}

export { database };
