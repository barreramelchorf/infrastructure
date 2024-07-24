import { Deployment } from './partials/deployment';
import { Metadata } from './partials/metadata';
import { App } from '../../app';

export interface PerStoreKubernetesApp extends App, Metadata {
  stores: {
    [key: string]: StoreConfiguration;
  };
}

export interface StoreConfiguration extends Metadata {
  deployment: Deployment;
}
