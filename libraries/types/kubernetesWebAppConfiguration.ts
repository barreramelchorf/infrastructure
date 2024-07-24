import { KubernetesAppConfiguration } from './kubernetesAppConfiguration';

export interface KubernetesWebAppConfiguration extends KubernetesAppConfiguration {
  host: string;
}
