import * as config from './config';
import { namespace } from './namespace';
import { AppDocs } from '../../../libraries/types/appDocs';

export const docs = new AppDocs(config.projectName, {
  metadata: {
    namespace: namespace.metadata.name,
    labels: config.app.labels,
  },
  spec: {
    imageRepository: config.app.imageRepository,
    version: config.app.version,
    rootDomain: config.shared.domain,
  },
});
