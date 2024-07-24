import * as pulumi from '@pulumi/pulumi';
import * as config from '../../config/standard';

export const apiStaging = new pulumi.StackReference(`organization/${config.projectName}/staging`);
