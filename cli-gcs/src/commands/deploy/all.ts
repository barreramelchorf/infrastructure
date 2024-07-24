import { Command, flags } from '@oclif/command';
import * as process from 'process';
import * as execa from 'execa';
import { parseChangedFiles } from '../../libraries/filesChange';
import { getEnvironmentStacks } from '../../libraries/stacks';

export default class All extends Command {
  static description = 'Execute pulumi apply for all applications changed since last successful commit';

  static examples = [`$ infrastructure deploy:all <commit>`];

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  static args = [
    {
      name: 'previousCommit',
      required: true,
      description: 'last successful commit hash',
    },
  ];

  async run(): Promise<void> {
    const { args } = this.parse(All);

    if (args.debug) {
      this.log(`Executing: "git rev-list HEAD...${args.previousCommit} --grep='\\[ci skip\\]' --invert-grep | xargs -I {} git log --format="" --name-only -n1 {} --"`);
    }

    this.log(`Detecting changes since: ${args.previousCommit}`);

    const { stdout } = execa.commandSync(
      `git rev-list HEAD...${args.previousCommit} --grep='\\[ci skip\\]' --invert-grep | xargs -I {} git log --format="" --name-only -n1 {} --`,
      {
        shell: true,
      }
    );
    const changedFiles = stdout.split('\n');

    const projects = parseChangedFiles(changedFiles);

    if (Object.keys(projects).length <= 0) {
      this.log('No changed projects detected');
      this.exit(0);
    }

    this.log('Applying changes for the following projects: ');
    Object.keys(projects).forEach((project) => {
      this.log(project);
    });

    if (Object.keys(projects).length > 5) {
      this.log('\x1b[33mToo many projects to preview. Exiting...\x1b[0m');
      this.log('\x1b[33mIn case you did not make changes to some of the listed projects, this is likely a gitlab error, please\x1b[0m');
      this.log('\x1b[33mremember to update master before pushing your changes, rebase and try again, or try opening a new MR again\x1b[0m');
      process.exit(1);
    }

    const failedProjects: { [key: string]: string[] } = {};

    for (const project in projects) {
      let executeAllStacks = false;

      projects[project].forEach((changedFile) => {
        if (changedFile.match(/\.ts/)) {
          executeAllStacks = true;
        }
      });

      const environments = getEnvironmentStacks(projects, project, executeAllStacks);

      this.log();
      this.log(`Beginning update of ${project} in [${environments.join(', ')}]`);

      for (const environment of environments) {
        // Select the environment and automatically create it if it does not exist
        const selectEnvironment = execa('pulumi', [
          'stack',
          '--cwd',
          project,
          'select',
          `${environment}`,
          '-c',
          '--secrets-provider=passphrase',
        ]);
        selectEnvironment?.stdout?.pipe(process.stdout);
        await selectEnvironment;

        // Apply the changes
        try {
          const apply = execa('pulumi', ['up', '--cwd', project, '-s', `${environment}`, '--skip-preview', '--yes', '--suppress-outputs'], { stdio: 'inherit' });
          apply?.stdout?.pipe(process.stdout);
          await apply;
        } catch (error) {
          this.log(error.message);

          if (!failedProjects[project]) {
            failedProjects[project] = [];
          }

          failedProjects[project].push(environment);
        }
      }

      this.log(`End of preview for ${project}`);
    }

    if (Object.keys(failedProjects).length > 0) {
      this.log();
      this.log('The following projects had issues with applying changes:');
      this.log();
      Object.keys(failedProjects).forEach((failedProject) => {
        this.log(`${failedProject}: [${failedProjects[failedProject].join(', ')}]`);
      });
      this.exit(1);
    }
  }
}
