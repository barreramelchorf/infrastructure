export type Annotations = {
  [key: string]: string;
};

export const pulumiAnnotations: Annotations = {
  'pulumi.com/patchForce': 'true',
};

export function linkerdAnnotation(state?: string): Annotations {
  return {
    'linkerd.io/inject': state == 'disabled' ? 'disabled' : 'enabled',
  };
}

export function linkerdIngressNginxAnnotation(visibility: string, state?: string): Annotations {
  return {
    'prometheus.io/scrape': 'true',
    'prometheus.io/port': '10254',
    'linkerd.io/inject': state == 'disabled' ? 'disabled' : 'enabled',
    ...(visibility == 'external' ? { 'config.linkerd.io/skip-inbound-ports': '80,443' } : {}), //<-- This lets us whitelist by ip by bypassing it on specified ports
  };
}
