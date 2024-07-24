import { KubernetesApp } from './app';

export interface KubernetesWebApp extends KubernetesApp {
  host: string;
}
