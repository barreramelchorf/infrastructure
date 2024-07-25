import { Command, flags } from '@oclif/command';
import * as process from 'process';
import * as execa from 'execa';
import { parseChangedFiles } from '../../libraries/filesChange';
import { getEnvironmentStacks } from '../../libraries/stacks';

export default class Preview extends Command {
  static description = 'Execute pulumi preview for diff all applications changes from main';

  static examples = ['$ infrastructure deploy:preview'];

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  async run(): Promise<void> {
    const { stdout } = execa.commandSync(`git rev-list origin/main...HEAD --grep='\\[ci skip\\]' --invert-grep | xargs -I {} git log --format="" --name-only -n1 {} --`, {
      shell: true,
    });
    const changedFiles = stdout.split('\n');

    const projects = parseChangedFiles(changedFiles);

    if (Object.keys(projects).length <= 0) {
      this.log('No changed projects detected');
      this.exit(0);
    }

    this.log('Previewing changes for the following projects: ');
    Object.keys(projects).forEach((project) => {
      this.log(project);
    });

    //Validating there is no more than 5 changes
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
      this.log(`Beginning preview of ${project} in [${environments.join(', ')}]`);

      for (const environment of environments) {
        // Select the environment and automatically create it if it does not exist
        const selectEnvironment = execa('pulumi', ['stack', '--cwd', project, 'select', `${environment}`, '-c', '--secrets-provider=passphrase']);
        selectEnvironment?.stdout?.pipe(process.stdout);
        await selectEnvironment;

        // Apply the changes
        try {
          const preview = execa('pulumi', ['preview', '--cwd', project, '-s', `${environment}`, '--suppress-outputs'], { stdio: 'inherit' });
          preview?.stdout?.pipe(process.stdout);
          await preview;
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
      this.log('The following projects had issues with previewing changes:');
      this.log();
      Object.keys(failedProjects).forEach((failedProject) => {
        this.log(`${failedProject}: [${failedProjects[failedProject].join(', ')}]`);
      });
      this.exit(1);
    }
  }
}
