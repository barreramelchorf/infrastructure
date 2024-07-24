import AppOutput from '../../../libraries/types/appOutput';
import * as config from './config';
import { serviceHost } from './service';
import { Deployment } from './deployment';
import { Hpa } from './horizontalPodAutoscaler';
import { namespace } from './namespace';
import { PodDisruptionBudget } from '../../../libraries/kubernetes/poddisruptionbudget';

export = async (): Promise<AppOutput> => {
  require('./envVars');
  require('./service');
  require('./ingress');
  require('./migrations');
  const deployment = Deployment();
  Hpa(deployment);
  PodDisruptionBudget(config.app.labels, namespace);
  return {
    hosts: [config.app.host],
    serviceHosts: [serviceHost],
  };
};
