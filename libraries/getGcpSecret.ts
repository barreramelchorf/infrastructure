import * as gcp from '@pulumi/gcp';

export const getGcpSecret = async (secretName: string): Promise<gcp.secretmanager.GetSecretVersionResult> => {
  return await gcp.secretmanager.getSecretVersion({
    secret: secretName,
  });
};

export const getGcpSecretBase64 = async (secretName: string): Promise<string> => {
  const secret = await getGcpSecret(secretName);

  return Buffer.from(secret.secretData).toString('base64');
};
