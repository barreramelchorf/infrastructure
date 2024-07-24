import * as k8s from '@pulumi/kubernetes';
import { getSecretEnvVars } from '../../getSecretEnvVars';
import { getGcpSecretBase64 } from '../../getGcpSecret';
import { Output } from '@pulumi/pulumi';
import * as config from '../../../config/standard';

export const Secret = async (namespace: Output<k8s.core.v1.Namespace> | k8s.core.v1.Namespace, store?: string | undefined) => {
  const secretEnvVars = Object.entries({ ...getSecretEnvVars(), ...getSecretEnvVars(store) });
  const envVars: { [key: string]: Promise<string> } = {};
  for (const key in secretEnvVars) {
    const secretEnvVarKey = secretEnvVars[key][0];
    const secretEnvVarValue = secretEnvVars[key][1];
    envVars[secretEnvVarKey] = getGcpSecretBase64(secretEnvVarValue);
  }
  await Promise.all(Object.values(envVars));

  return new k8s.core.v1.Secret(`${config.projectName}${store ? `-${store}` : ''}`, {
    type: 'Opaque',
    metadata: {
      namespace: namespace.metadata.name,
    },
    data: envVars,
  });
};
