import * as fs from 'fs';
import * as yaml from 'js-yaml';

export const getVersion = (filePathPulumi: string, applicationName: string): string => {
  const fileContents = fs.readFileSync(filePathPulumi, 'utf8');
  const configuration = yaml.load(fileContents);
  return configuration['config'][`${applicationName}:app`]['version'];
};
