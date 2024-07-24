import * as pulumi from '@pulumi/pulumi';

export function getEnvVars(): { [key: string]: string } {
  const config = new pulumi.Config();

  return config.getObject<{ env: { [key: string]: string } }>('app')?.env ?? {};
}
