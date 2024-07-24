import { Input } from '@pulumi/pulumi';

export default interface AppOutput {
  hosts?: Input<string>[] | string[];
  serviceHosts?: Input<string>[];
  docHost?: string;
}
