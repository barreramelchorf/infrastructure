import AbstractNotifier, { NotificationType, Request } from './abstractNotifier';
import axios from 'axios';
import * as process from 'process';

export enum Type {
  RELEASE = 'Release',
  FAILED = 'Failed',
}

export class ReleaseControl extends AbstractNotifier {
  readonly releaseControlApiUrl = process.env.RELEASE_CONTROL_HOST || 'https://release-control.barreramelchorf.top/api/deployment';

  readonly releaseControlApiKey: string | undefined = process.env.RELEASE_CONTROL_API_KEY;

  async notify(request: Request): Promise<void> {
    if (!this.releaseControlApiKey || !request.version) {
      this.log('You MUST set RELEASE_CONTROL_API_KEY to notify Release Control of deployments');
      return;
    }

    const body = JSON.stringify({
      name: `barreramelchorf/${request.application}`,
      environment: request.environment,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      release_name: request.version.toString(),
      revision: request.version,
      type: request.type === NotificationType.SUCCESS ? Type.RELEASE : Type.FAILED,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      time_taken: request.timeTaken,
    });

    try {
      const response = await axios.post(this.releaseControlApiUrl, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': this.releaseControlApiKey,
        },
        timeout: 5000,
      });

      if (response.status === 201) {
        this.log('Release-Control notified!');
      } else {
        this.log(`Release-Control notification failed: [${response.status}] ${response.data}`);
      }
    } catch (e) {
      this.log(`Release-Control notification failed ${e}`);
      this.log(`Error description: ${e?.response?.data}`);
      this.log(`Request: ${body}`);
    }
  }
}
