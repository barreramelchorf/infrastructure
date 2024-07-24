import * as globalConfig from './../config/standard';
import * as reviewApps from './reviewApps';

export enum Squads {
  COMMERCIAL_INSIGHTS = 'commercial-insights',
  CUSTOMER_COMMS = 'customer-comms',
  DISCOVERY = 'discovery',
  FINANCE = 'finance',
  LOGISTICS = 'logistics-and-operations',
  CATALOG = 'catalog',
  PAYMENTS_AND_CHECKOUT = 'payments-and-checkout',
  PLUGINS_AND_API = 'plugins-and-api',
  RELATIONSHIP_MANAGEMENT = 'relationship-management',
  SELLER_EXPERIENCE = 'seller-experience',
}

export enum Components {
  ASSETS = 'assets',
  API = 'api',
  BACKEND = 'backend',
  CRONJOB = 'cronjob',
  FRONTEND = 'frontend',
  FULLSTACK = 'fullstack',
  MASTER = 'master',
  PROXY = 'proxy',
  REDIRECT = 'redirect',
  SYSTEM = 'system',
  MIGRATIONS = 'migrations',
}

export type Labels = {
  [key: string]: string;
};

export function addLabels(metadata: { component?: Components | string; squad?: Squads }, labels: Labels): Labels {
  if (metadata.squad) {
    labels = {
      'app.k8s.com/squad': metadata.squad,
      ...labels,
    };
  }

  return reviewApps.addLabels({
    'app.k8s.com/env': globalConfig.environment,
    'app.kubernetes.io/name': globalConfig.projectName,
    'app.kubernetes.io/part-of': globalConfig.projectName,
    'app.kubernetes.io/component': metadata.component ?? globalConfig.projectName,
    ...labels,
  });
}
