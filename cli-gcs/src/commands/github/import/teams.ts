import { Command, flags } from '@oclif/command';
import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { camelCase } from 'lodash';
import { Octokit } from '@octokit/rest';

interface Member {
  id: number;
  login: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string;
  privacy: string;
  parent: {
    id: string;
  };
}

export default class Teams extends Command {
  static description = 'Import teams from GitHub to pulumi';

  static examples = [`$ infrastructure github:import:teams`];

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  static args = [];

  async run(): Promise<void> {
    const { args } = this.parse(Teams);

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const teams: Team[] = [];

    const requestOptions = octokit.teams.list.endpoint.merge({
      org: 'Personal',
      type: 'all',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      per_page: 50,
    });

    for await (const response of octokit.paginate.iterator<Team>(requestOptions)) {
      response.data.forEach((team) => {
        teams.push(team);
      });
    }

    for (const team of teams) {
      console.log(`Importing ${team.name}`);

      const membersById: { [key: number]: Member } = {};

      for (const role of ['member', 'maintainer']) {
        let requestOptions = octokit.teams.listMembersInOrg.endpoint.merge({
          org: 'Personal',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          team_slug: team.slug,
          role: role,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          per_page: 50,
        });

        for await (const response of octokit.paginate.iterator<Member>(requestOptions)) {
          response.data.forEach((member) => {
            member.role = role;
            membersById[member.id] = member;
          });
        }
      }

      const members = Object.values(membersById);

      fs.writeFileSync(
        path.join(`./infrastructure/vcs/github/teams/`, `${camelCase(team.slug)}.ts`),
        `import * as github from '@pulumi/github';
import * as pulumi from '@pulumi/pulumi';
import { TeamMembership } from './index';

export = async (parent: pulumi.ComponentResource) => {
  const members: TeamMembership[] = ${
    members.length
      ? `[${members.map(
          (member) => `
    {
      username: '${member.login}',
      role: '${member.role}',
    }`
        )},
  ];`
      : '[];'
  }

  return {
    id: ${team.id},
    team: new github.Team(
      '${team.slug}',
      {
        name: '${team.name}',
        description: ${team.description ? `'${team.description}'` : undefined},
        privacy: '${team.privacy}',
        parentTeamId: ${team.parent?.id ? `${team.parent.id}` : undefined},
      },
      {
        parent: parent,
        import: '${team.id}',
      }
    ),
    members: members,
  };
};
`
      );
    }
  }
}
