import { Response } from './notifier';

export enum NotificationType {
  SUCCESS,
  FAILURE,
  IN_PROGRESS,
}

export enum NotifierName {
  RELEASE_CONTROL,
  SLACK,
  GITHUB,
  SENTRY,
}

export interface NotificationRequest {
  application: string;
  environment: string;
  timeTaken: number;
  version: string;
  payload?: Response[];
  hosts?: string[];
}

export interface Request extends NotificationRequest {
  type: NotificationType;
  payloadResponse: any;
}

export default abstract class AbstractNotifier {
  log: (message?: string, ...args: any[]) => void;

  constructor(log: (message?: string, ...args: any[]) => void) {
    this.log = log;
  }

  abstract async notify(request: Request): Promise<any>;
}
