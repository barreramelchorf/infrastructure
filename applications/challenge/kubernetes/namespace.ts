import * as k8s from '@pulumi/kubernetes';
import * as config from './config';
import { getNamespace } from '../../../libraries/namespace';
import * as annotations from '../../../libraries/annotations';

export const namespace = new k8s.core.v1.Namespace(config.projectName, {
  metadata: {
    name: getNamespace(),
    labels: config.app.labels,
    annotations: annotations.linkerdAnnotation('disabled'),
  },
});
