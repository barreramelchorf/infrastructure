import * as pulumi from '@pulumi/pulumi';
import { getEnvironment } from '../libraries/environment';
import getSharedConfig from './index';

export const project = new pulumi.Config();
export const environment = getEnvironment();
export const shared = getSharedConfig(environment);
export const projectName = pulumi.getProject();
export const kubernetes = new pulumi.Config('kubernetes');
export const aws = new pulumi.Config('aws');
export const gcp = new pulumi.Config('gcp');
export * from '../libraries/getGcpSecret';
