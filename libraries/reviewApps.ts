import { ReviewAppConfiguration } from './types/reviewAppConfiguration';
import * as pulumi from '@pulumi/pulumi';
import { Labels } from './labels';

export function getReviewAppConfiguration(): ReviewAppConfiguration | undefined {
  const config = new pulumi.Config();

  return config.getObject<{ reviewApp: ReviewAppConfiguration }>('app')?.reviewApp;
}

export function addLabels(labels: Labels): Labels {
  if (!isReviewApp()) {
    return labels;
  }

  labels['app.k8s.com/reviewApp'] = 'true';
  labels['app.k8s.com/pr'] = `${getReviewAppConfiguration()?.pr}`;

  return labels;
}

export function isReviewApp(): boolean {
  return !!getReviewAppConfiguration()?.pr;
}
