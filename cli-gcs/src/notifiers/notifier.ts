import AbstractNotifier, { NotificationRequest as NotificationBaseRequest, NotificationType, NotifierName, Request } from './abstractNotifier';
interface NotifierType {
  name: NotifierName;
  notifier: AbstractNotifier;
}

export interface Response {
  name: NotifierName;
  payload: any;
}

interface NotificationRequest extends NotificationBaseRequest {
  type: NotificationType;
  notifiers?: NotifierName[];
}

export default class Notifier {
  notifiers: NotifierType[];

  log: (message?: string, ...args: any[]) => void;

  constructor(log: (message?: string, ...args: any[]) => void) {
    this.log = log;
    this.notifiers = [
      // { name: NotifierName.RELEASE_CONTROL, notifier: new ReleaseControl(log) },
      // { name: NotifierName.SLACK, notifier: new Slack(log) },
      // { name: NotifierName.SENTRY, notifier: new Sentry(log) },
    ];
  }

  async notifyInProgress(notificationRequest: NotificationBaseRequest): Promise<Response[]> {
    return this.notify({
      ...notificationRequest,
      type: NotificationType.IN_PROGRESS,
      notifiers: [NotifierName.GITHUB],
    });
  }

  async notifySuccess(notificationRequest: NotificationBaseRequest): Promise<Response[]> {
    return this.notify({
      ...notificationRequest,
      type: NotificationType.SUCCESS,
    });
  }

  async notifyFailed(notificationRequest: NotificationBaseRequest): Promise<Response[]> {
    return this.notify({
      ...notificationRequest,
      type: NotificationType.FAILURE,
    });
  }

  private async notify(notificationRequest: NotificationRequest): Promise<Response[]> {
    const responses: Response[] = [];
    for (const index in this.notifiers) {
      const notifier = this.notifiers[index];
      if (notifier !== undefined && (notificationRequest.notifiers?.length === undefined || notificationRequest.notifiers?.includes(notifier.name))) {
        const request: Request = {
          ...notificationRequest,
          payloadResponse: this.extractPayloadByNotifier(notifier.name, notificationRequest.payload),
        };
        try {
          const response = await notifier.notifier.notify(request);
          responses.push({ name: notifier.name, payload: response });
        } catch (error) {
          this.log(error.message || JSON.stringify(error));
          responses.push({ name: notifier.name, payload: null });
        }
      }
    }

    return responses;
  }

  private extractPayloadByNotifier(notifierName: NotifierName, payloads?: Response[]): any {
    return payloads
      ?.filter(({ name }) => notifierName === name)
      .map(({ payload }) => payload)
      .reduce((initial, payload) => payload, undefined);
  }
}
