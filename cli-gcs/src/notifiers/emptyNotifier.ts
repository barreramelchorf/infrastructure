import { Response } from './notifier';

export default class EmptyNotifier {
  async notifyInProgress(): Promise<Response[]> {
    return this.notify();
  }

  async notifySuccess(): Promise<Response[]> {
    return this.notify();
  }

  async notifyFailed(): Promise<Response[]> {
    return this.notify();
  }

  private async notify() {
    return new Promise<Response[]>((resolve) => {
      resolve([]);
    });
  }
}
