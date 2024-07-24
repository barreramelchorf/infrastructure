import { isReviewApp } from './reviewApps';
import { getReviewAppConfiguration } from './reviewApps';
import * as pulumi from '@pulumi/pulumi';

export function getNamespace(): string {
  if (isReviewApp()) {
    return `${pulumi.getProject()}-pr-${getReviewAppConfiguration()?.pr}`;
  }

  return pulumi.getProject();
}
