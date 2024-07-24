import { Deployment } from './partials/deployment';
import { Metadata } from './partials/metadata';
import { App } from '../../app';

export interface KubernetesApp extends App, Metadata {
  deployment: Deployment;
  stores: string[];
}
