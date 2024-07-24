import * as fs from 'fs';
import * as path from 'path';

const getPulumiProjectDir = (changedFile: string, currentDirectory: string): undefined | string => {
  if (currentDirectory == '.') {
    return;
  }

  if (fs.existsSync(path.join(currentDirectory, 'Pulumi.yaml'))) {
    return currentDirectory;
  }

  return getPulumiProjectDir(changedFile, path.dirname(currentDirectory));
};

export const parseChangedFiles = (changedFiles: string[]): { [key: string]: string[] } => {
  const projects: { [key: string]: string[] } = {};

  changedFiles
    .filter((changedFile) => {
      return !changedFile.match(/^templates\//);
    })
    .forEach((changedFile) => {
      const projectDir = getPulumiProjectDir(changedFile, path.dirname(changedFile));

      if (!projectDir) {
        return;
      }

      if (fs.existsSync(path.join(projectDir, '.ciignore'))) {
        return;
      }

      if (!fs.existsSync(path.join(projectDir, '.gcs'))) {
        return;
      }

      if (!projects[projectDir]) {
        projects[projectDir] = [];
      }

      projects[projectDir].push(changedFile);
    });

  return projects;
};
