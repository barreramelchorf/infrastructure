import * as pulumi from '@pulumi/pulumi';
import { isReviewApp } from './reviewApps';

export function getEnvironment(): string {
  // Allow us to map non-standard stack names to environment names
  if (isReviewApp()) {
    return 'staging';
  }
  switch (pulumi.getStack()) {
    case 'production-vault':
    case 'production-api': {
      return 'production';
    }
    case 'staging-vault':
    case 'staging-api': {
      return 'staging';
    }
    case 'support-vault':
    case 'support-api':
    case 'support-vault-staging':
    case 'support-api-staging':
    case 'support-vault-production':
    case 'support-api-production': {
      return 'support';
    }
    default: {
      return pulumi.getStack();
    }
  }
}
