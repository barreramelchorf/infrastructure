import { remote, types } from '@pulumi/command';
import * as yaml from 'js-yaml';
import * as pulumi from '@pulumi/pulumi';

export type DatadogArgs = {
  conf: {
    apiKey: string;
    apmConfig: {
      enabled: boolean;
      env: string;
    };
    logsEnabled: boolean;
    logsConfig: {
      openFilesLimit: number;
    };
    tags: { [key: string]: string }[];
  };
  connection: types.input.remote.ConnectionArgs;
  version: number;
};

export const DatadogAgent = (args: DatadogArgs) => {
  const configuration = {
    dd_url: 'https://app.datadoghq.com',
    api_key: args.conf.apiKey,
    check_runners: 1,
    apm_config: {
      enabled: args.conf.apmConfig.enabled,
      env: args.conf.apmConfig.env,
    },
    process_config: {
      enabled: true,
    },
    logs_enabled: args.conf.logsEnabled,
    logs_config: {
      open_files_limit: args.conf.logsConfig.openFilesLimit,
    },
    tags: args.conf.tags,
  };

  const configYaml = Buffer.from(yaml.dump(configuration)).toString('base64');

  new remote.Command('datadog-configuration', {
    connection: args.connection,
    create: `sudo mkdir -p /etc/datadog-agent && echo ${configYaml} | base64 -d | sudo tee /etc/datadog-agent/datadog.yaml`,
  });

  const datadogInstallation = new remote.Command('datadog-installation', {
    connection: args.connection,
    create: pulumi.interpolate`DD_AGENT_MAJOR_VERSION=${args.version} DD_API_KEY=${pulumi
      .secret(args.conf.apiKey)
      .apply((apiKey) => apiKey)} DD_SITE="app.datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"`,
  });

  datadogInstallation.stderr.apply((err) => pulumi.log.info(err));
  datadogInstallation.stdout.apply((out) => pulumi.log.info(out));
};
