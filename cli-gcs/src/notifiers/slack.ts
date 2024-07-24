import AbstractNotifier, { NotificationType, Request } from './abstractNotifier';
import * as process from 'process';
import axios from 'axios';

enum Block {
  PROJECT = 'project',
  STATUS = 'status',
  DATE = 'date',
  ENVIRONMENT = 'environment',
  BUILD = 'build',
  REVISION = 'revision',
  COUNTRY = 'country',
  USER = 'user',
  BU = 'bu',
}

interface SlackConfig {
  name: string;
  url: string;
  channel: string;
  status: NotificationType[];
  blocks: Block[];
  stages: string[];
}

interface SlackPayload {
  channel: string;
  blocks: { type: string; fields?: any[] | undefined }[];
}

interface BlocksPayload {
  config: SlackConfig;
  timestamp: number;
  environment: string;
  application: string;
  repositoryUrl: string;
  buildUrl: string;
  version: string;
  flags: string;
  message: string;
  username: string;
}

export class Slack extends AbstractNotifier {
  readonly configs: SlackConfig[] = [
    {
      name: 'local',
      url: 'https://hook.url',
      channel: 'releases-channel',
      status: [NotificationType.SUCCESS, NotificationType.FAILURE],
      blocks: [Block.PROJECT, Block.STATUS, Block.DATE, Block.ENVIRONMENT, Block.BUILD, Block.REVISION, Block.COUNTRY, Block.USER],
      stages: ['production'],
    },
    {
      name: 'falabella',
      url: 'https://hooks.slack.com/services/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',
      channel: 'production-deployments',
      status: [NotificationType.SUCCESS],
      blocks: [Block.BU, Block.PROJECT, Block.STATUS, Block.DATE, Block.ENVIRONMENT, Block.BUILD, Block.REVISION, Block.USER, Block.COUNTRY],
      stages: ['production'],
    },
  ];

  async notify(request: Request): Promise<void> {
    const repositoryUrl: string = process.env.CI_PROJECT_URL || `https://github.com/barreramelchorf/${request.application}`;
    const buildUrl: string | undefined = process.env.CI_BUILD_URL || process.env.CF_BUILD_URL || process.env.CI_PIPELINE_URL || repositoryUrl;
    const username: string = process.env.USER || process.env.GIT_AUTHOR_NAME || process.env.CF_BUILD_INITIATOR || process.env.CI_DEPLOY_USER || process.env.GITLAB_USER_NAME || '';

    for (const index in this.configs) {
      const config = this.configs[index];
      if (!config.stages.includes(request.environment)) {
        continue;
      }

      const blocksPayload: BlocksPayload = {
        config,
        timestamp: Math.floor(Date.now() / 1000),
        environment: request.environment,
        application: request.application,
        repositoryUrl,
        buildUrl,
        version: request.version,
        flags: ':earth_americas:',
        message: request.type === NotificationType.SUCCESS ? 'success :tada:' : 'failed :boom::boom::boom:',
        username,
      };

      const body = JSON.stringify(this.buildBlocksPayload(blocksPayload));

      try {
        const response = await axios.post(config.url, body, { timeout: 5000 });
        if (response.status === 200) {
          this.log(`Slack ${config.name} notified!`);
        } else {
          this.log(`Slack error: ${response?.data}`);
        }
      } catch (e) {
        this.log(`Slack notification failed: ${e}`);
        this.log(`Error description: ${e?.response?.data}`);
        this.log(`Request: ${body}`);
      }
    }
  }

  private buildBlocksPayload(payload: BlocksPayload): SlackPayload {
    const blocksMessage = {
      [Block.STATUS]: {
        type: 'mrkdwn',
        text: `*Status*: ${payload.message}`,
      },
      [Block.BU]: {
        type: 'mrkdwn',
        text: '*Business Unit*: Business Unit',
      },
      [Block.DATE]: {
        type: 'mrkdwn',
        text: `*Date*: <!date^${payload.timestamp}^{date_num} {time_secs}|2014-02-18 6:39:42 AM PST>`,
      },
      [Block.ENVIRONMENT]: {
        type: 'mrkdwn',
        text: `*Environment*: ${payload.environment}`,
      },
      [Block.PROJECT]: {
        type: 'mrkdwn',
        text: `*Project*: <${payload.repositoryUrl}|${payload.application}>`,
      },
      [Block.BUILD]: {
        type: 'mrkdwn',
        text: `<${payload.buildUrl}|View build logs>`,
      },
      [Block.REVISION]: {
        type: 'mrkdwn',
        text: `*Revision*: <${payload.repositoryUrl}/commit/${payload.version}|${payload.version}>`,
      },
      [Block.COUNTRY]: {
        type: 'mrkdwn',
        text: `*Country*: ${payload.flags}`,
      },
      [Block.USER]: {
        type: 'mrkdwn',
        text: `*User*: ${payload.username}`,
      },
    };

    return {
      channel: payload.config.channel,
      blocks: [
        {
          type: 'divider',
        },
        {
          type: 'section',
          fields: payload.config.blocks.filter((block: Block) => block in blocksMessage).map((block: Block) => blocksMessage[block]),
        },
      ],
    };
  }
}
