import { VisibilityTypes } from './visibilityTypes';
import { ReviewAppConfiguration } from './reviewAppConfiguration';

export interface App {
  version: string;
  migrationsVersion?: string;
  visibility: VisibilityTypes;
  monitor?: boolean;
  synthetics?: boolean;
  reviewApp?: ReviewAppConfiguration;
}
