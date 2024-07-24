import * as pulumi from '@pulumi/pulumi';
import getSharedConfig from '../config';
import { getEnvironment } from './environment';
import { isReviewApp, getReviewAppConfiguration } from './reviewApps';

export function getHost(projectNameOverride?: string, store?: string): string {
  const sharedConfig = getSharedConfig(getEnvironment());
  const projectName = projectNameOverride ?? pulumi.getProject();

  if (isReviewApp()) {
    const reviewAppConfiguration = getReviewAppConfiguration();
    const prefixDomain = reviewAppConfiguration?.prefixDomain ? `.${reviewAppConfiguration.prefixDomain}` : '';
    return `${projectName}${store ? `-${store}` : ''}-${reviewAppConfiguration?.pr}${prefixDomain}.reviewapps.${sharedConfig.domain}`;
  }

  return `${projectName}.${sharedConfig.domain}`;
}
