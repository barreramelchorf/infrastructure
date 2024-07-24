import AbstractNotifier, { NotificationType, Request } from './abstractNotifier';
import axios, { AxiosInstance } from 'axios';
import * as process from 'process';

interface CreateStatusRequest {
  httpClient: AxiosInstance;
  payload: any;
  buildUrl: string;
  type: string;
  hosts: string[] | undefined;
}

export class Github extends AbstractNotifier {
  readonly githubToken: string | undefined = process.env.GITHUB_TOKEN;

  readonly githubApiHost: string = process.env.GITHUB_API_HOST || 'https://api.github.com';

  readonly githubApiHeaderAccept: string = process.env.GITHUB_API_HEADER_ACCEPT || 'application/vnd.github.ant-man-preview+json, application/vnd.github.flash-preview+json';

  async notify(request: Request): Promise<any> {
    if (!this.githubToken) {
      this.log('You MUST set GITHUB_TOKEN to notify Github of deployments');
      return;
    }

    const repositoryUrl = `https://github.com/barreramelchorf/${request.application}`;
    const buildUrl: string | undefined = process.env.CI_BUILD_URL || process.env.CF_BUILD_URL || repositoryUrl;
    const baseUrl = `${this.githubApiHost}/repos/barreramelchorf/${request.application}`;
    const type = this.buildType(request.type);

    const httpClient = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      headers: {
        Authorization: `token ${this.githubToken}`,
        Accept: this.githubApiHeaderAccept,
      },
    });

    if (request.type === NotificationType.IN_PROGRESS) {
      return this.createDeployment(httpClient, request, buildUrl, type);
    }

    await this.createStatus({
      httpClient,
      buildUrl,
      type,
      payload: request.payloadResponse,
      hosts: request?.hosts,
    });
  }

  private buildType(notificationType: NotificationType): string {
    switch (notificationType) {
      case NotificationType.FAILURE:
        return 'failure';
      case NotificationType.SUCCESS:
        return 'success';
      default:
        return 'in_progress';
    }
  }

  private async createDeployment(httpClient: AxiosInstance, notificationRequest: Request, buildUrl: string, type: string): Promise<any> {
    const username: string = process.env.USER || process.env.GIT_AUTHOR_NAME || process.env.CF_BUILD_INITIATOR || '';
    const body = JSON.stringify({
      ref: notificationRequest.version.toString(),
      environment: notificationRequest.environment,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      required_contexts: [],
      payload: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        build_url: buildUrl,
        username,
      },
      description: `The deploy ${type}!`,
    });

    try {
      const response = await httpClient.post('/deployments', body);

      if (response.status !== 201) {
        this.log(`GitHub notifier error: ${response?.data}`);
        return;
      }
      if (!response?.data?.id) {
        this.log(`GitHub response error, not return "id": ${JSON.stringify(response?.data)}`);
        return;
      }

      return response?.data?.id;
    } catch (e) {
      this.log(`GitHub notification failed deployment: ${e}`);
      this.log(`Error description: ${JSON.stringify(e?.response?.data)}`);
      this.log(`Request: ${body}`);
    }
  }

  private async createStatus(request: CreateStatusRequest): Promise<void> {
    if (!request.payload) {
      this.log('You request MUST set the payload with deployId value');
      return;
    }

    const statusRequest: any = {
      state: request.type,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      log_url: request.buildUrl,
      description: `The deploy ${request.type}!`,
      context: 'ci/codefresh',
    };

    if (request?.hosts !== undefined && request?.hosts[0] !== undefined) {
      statusRequest['environment_url'] = `https://${request?.hosts[0]}`;
    }

    const body = JSON.stringify(statusRequest);

    try {
      const response = await request.httpClient.post(`/deployments/${request.payload}/statuses`, body);
      if (response.status !== 201) {
        this.log(`Github notifier error: ${response?.data}`);
        return;
      }
      this.log(`GitHub notified!`);
    } catch (e) {
      this.log(`GitHub notification failed status: ${e}`);
      this.log(`Error description: ${JSON.stringify(e?.response?.data)}`);
      this.log(`Request: ${body}`);
    }
  }
}
