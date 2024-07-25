import { Command, flags } from '@oclif/command';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import * as execa from 'execa';

export default class ReviewApp extends Command {
  static description = "Execute pulumi for an application's pull request.";

  static examples = [`$ infrastructure deploy:app <application> <pr>`];

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  static args = [
    {
      name: 'application',
      required: true,
      description: 'application name',
    },
    {
      name: 'pr',
      require: true,
      description: 'pull request number',
    },
  ];

  async run(): Promise<void> {
    const { args } = this.parse(ReviewApp);

    const applicationPath = path.join('applications', args.application);
    if (!fs.existsSync(applicationPath)) {
      this.error('Application does not exist!');
    }

    const environment = `pr${args.pr}`;

    process.chdir(applicationPath);

    if (!fs.existsSync(path.join('./', `Pulumi.${environment}.yaml`))) {
      this.error(`Configuration file is missing for application ${args.application} in ${environment} environment!`);
      this.exit(1);
    }

    // Select the stack and automatically create it if it does not exist
    execa('pulumi', ['stack', 'select', `${environment}`, '-c', '--secrets-provider=passphrase'], { stdio: 'inherit' })?.stdout?.pipe(process.stdout);

    // Apply the changes
    try {
      const apply = execa('pulumi', ['-s', `${environment}`, 'up', '--yes'], { stdio: 'inherit' });
      apply?.stdout?.pipe(process.stdout);
      await apply;
    } catch (error) {
      this.exit(1);
    }
  }
}
