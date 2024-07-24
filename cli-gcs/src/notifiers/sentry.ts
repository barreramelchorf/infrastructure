import AbstractNotifier, { NotificationType, Request } from './abstractNotifier';
import * as process from 'process';
import axios, { AxiosInstance } from 'axios';

export class Sentry extends AbstractNotifier {
  readonly sentryApiToken: string | undefined = process.env.SENTRY_API_TOKEN;
  readonly sentryOrganization: string | undefined = process.env.SENTRY_ORGANIZATION || 'barreramelchorf';

  async notify(request: Request): Promise<any> {
    if (request.type !== NotificationType.SUCCESS) {
      return;
    }

    if (!this.sentryApiToken) {
      this.log('You MUST set SENTRY_API_TOKEN to notify Sentry of deployments');
      return;
    }

    const body = JSON.stringify({
      version: request.version,
      refs: [
        {
          repository: `barreramelchorf/${request.application}`,
          commit: request.version,
        },
      ],
      projects: [request.application],
    });

    try {
      const http = axios.create({
        baseURL: `https://sentry.io/api/0/organizations/${this.sentryOrganization}`,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sentryApiToken}`,
        },
      });

      const response = await http.post('/releases/', body);

      // when you sent the same version will return 208 in the docs not inform it
      if (!(response.status > 200 && response.status < 300)) {
        this.log(`Sentry error: ${JSON.stringify(response?.data)}`);
        return;
      }

      this.createDeploy(request, http);
    } catch (error) {
      this.handleError(error, body);
    }
  }

  private async createDeploy(request: Request, http: AxiosInstance) {
    const requestDeploy: any = {
      environment: request.environment,
      name: request.version,
    };
    if (request?.hosts !== undefined && request?.hosts[0] !== undefined) {
      requestDeploy['url'] = `https://${request.hosts[0]}`;
    }

    const body = JSON.stringify(requestDeploy);
    try {
      const response = await http.post(`/releases/${request.version}/deploys/`, body);

      if (!(response.status >= 200 && response.status < 300)) {
        this.log(`Sentry error: ${JSON.stringify(response?.data)}`);
        return;
      }

      this.log('Sentry notified!');
    } catch (error) {
      this.handleError(error, body);
    }
  }

  private handleError(error: any, body: string): void {
    this.log(`Sentry notification failed: ${error?.message}`);
    this.log(`Error description: ${JSON.stringify(error?.response?.data)}`);
    this.log(`Request: ${body}`);
  }
}
