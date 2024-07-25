import * as aws from '@pulumi/aws';
import * as config from './config';
import * as pulumi from '@pulumi/pulumi';
import { isReviewApp } from '../../../libraries/reviewApps';

let database: aws.rds.Instance | pulumi.Output<aws.rds.Instance>;
let record: aws.route53.Record | pulumi.Output<aws.route53.Record>;

if (isReviewApp()) {
  const stagingRDatabase = config.stagingRef.getOutput('aws');
  database = stagingRDatabase.apply((database: { database: { instance: aws.rds.Instance } }) => database.database.instance);
  record = stagingRDatabase.apply((database: { database: { record: aws.route53.Record } }) => {
    console.log(database.database.record);
    return database.database.record;
  });
} else {
  const subnetGroup = new aws.rds.SubnetGroup(`${config.environment}-${config.projectName}`, {
    name: `${config.environment}-${config.projectName}`,
    description: `Subnet for the ${config.projectName}`,
    subnetIds: config.privateSubnets,
    tags: config.tags,
  });
  database = new aws.rds.Instance(`${config.projectName}-database`, {
    instanceClass: config.databaseConfig.instanceClass,
    allocatedStorage: config.databaseConfig.size,
    engine: config.databaseConfig.engine,
    engineVersion: config.databaseConfig.engineVersion,
    dbName: config.projectName,
    username: 'fernando',
    password: 'fernando123',
    dbSubnetGroupName: subnetGroup.name,
    vpcSecurityGroupIds: [config.securityGroup.id],
    skipFinalSnapshot: true,
  });
  record = new aws.route53.Record(`${config.environment}-${config.projectName}`, {
    name: `${config.projectName}-db.${config.shared.domain}`,
    records: [database.address],
    ttl: 300,
    type: 'CNAME',
    zoneId: config.shared.domains[config.shared.domain].zoneId,
  });
}

export { record, database };
