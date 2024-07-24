import * as fs from 'fs';
import * as path from 'path';

export const getEnvironmentStacks = (projects: { [key: string]: string[] }, project: string, executeAllStacks: boolean): string[] => {
  const unorderedStacks: string[] = [];

  fs.readdirSync(project).forEach((file: string) => {
    const matches = file.match(/Pulumi\.(.*)\.yaml/);

    if (!matches) {
      return;
    }

    const stack = matches[1];

    if (!executeAllStacks) {
      if (!projects[project].includes(path.join(project, `Pulumi.${stack}.yaml`))) {
        return;
      }
    }

    unorderedStacks.push(stack);
  });

  return Array.from(new Set(['all', 'support', 'staging', 'production', ...unorderedStacks])).filter((environment) => {
    if (unorderedStacks.includes(environment)) {
      return environment;
    }
  });
};
