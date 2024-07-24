import { Deployment } from './partials/deployment';
import { Metadata } from './partials/metadata';
import { App } from '../../app';
import { CronJob } from './partials/cronJob';

export interface PerStoreKubernetesWebApp extends App, Metadata {
  stores: {
    [key: string]: StoreConfiguration;
  };
}

export interface PerComponentKubernetesWebApp extends App, Metadata {
  components: {
    [key: string]: StoreConfiguration;
  };
  host: string;
}

export interface StoreConfiguration extends Metadata {
  host: string;
  deployment: Deployment;
  cronJobs?: { [type: string]: CronJob };
}
