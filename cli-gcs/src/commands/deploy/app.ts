import { Command, flags } from '@oclif/command';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import * as execa from 'execa';
import { getVersion } from '../../libraries/releaseVersion';
import Notifier from '../../notifiers/notifier';
import EmptyNotifier from '../../notifiers/emptyNotifier';

export default class App extends Command {
  static description = 'Execute pulumi for an application optionally with a specific environment.';

  static examples = [`$ infrastructure deploy:app <application> [<environment>]`];

  static flags = {
    help: flags.help({ char: 'h' }),
    'all-environments': flags.boolean({
      required: false,
      description: 'deploy application to all environments',
    }),
    'no-notify': flags.boolean({
      required: false,
      description: 'skip notifications, e.g deploy migrations',
    }),
  };

  static args = [
    {
      name: 'application',
      required: true,
      description: 'application name',
    },
    {
      name: 'environment',
      require: false,
      description: 'application environment',
    },
  ];

  async run(): Promise<void> {
    const { args, flags } = this.parse(App);

    const applicationPath = path.join('applications', args.application);
    if (!fs.existsSync(applicationPath)) {
      this.error('Application does not exist!');
    }

    if (!args.environment && !flags['all-environments']) {
      this.error(`You must pass an environment or specify --all-environments`);
    }

    const environment = args.environment;

    process.chdir(applicationPath);

    const pulumiFile = path.join('./', `Pulumi.${environment}.yaml`);
    if (!fs.existsSync(pulumiFile)) {
      this.error(`Configuration file is missing for application ${args.application} in ${environment} environment!`);
      this.exit(1);
    }

    const version = getVersion(pulumiFile, args.application);
    const notifier = flags['no-notify'] ? new EmptyNotifier() : new Notifier(this.log);

    const payloadInProgress = await notifier.notifyInProgress({
      application: args.application,
      environment,
      timeTaken: 0,
      version,
    });

    // Select the stack and automatically create it if it does not exist
    execa(
      'pulumi',
      [
        'stack',
        'select',
        `${environment}`,
        '-c',
        '--secrets-provider=passphrase',
      ],
      { stdio: 'inherit' }
    )?.stdout?.pipe(process.stdout);

    const startTime = Math.floor(Date.now() / 1000);

    // Apply the changes
    try {
      const apply = execa('pulumi', ['-s', `${environment}`, 'up', '--yes'], { stdio: 'inherit' });
      apply?.stdout?.pipe(process.stdout);
      await apply;

      const rawOutput = await execa('pulumi', ['stack', 'output', '-s', `${environment}`, '-j']);
      const stackOutputs = JSON.parse(rawOutput.stdout?.replace(/\n/gm, ''));

      const timeTaken = Math.floor(Date.now() / 1000) - startTime;

      await notifier.notifySuccess({
        application: args.application,
        environment,
        version,
        timeTaken,
        payload: payloadInProgress,
        hosts: stackOutputs?.app?.hosts,
      });
    } catch (error) {
      const timeTaken = Math.floor(Date.now() / 1000) - startTime;

      await notifier.notifyFailed({
        application: args.application,
        environment,
        version,
        timeTaken,
        payload: payloadInProgress,
      });

      this.exit(1);
    }
  }
}
