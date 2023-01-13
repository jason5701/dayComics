import 'dotenv/config';
import { Octokit } from '@octokit/core';

const octokit = new Octokit({ auth: process.env.ACCESS_TOKEN });

export const createIssue = async (title: string, body: string) => {
  await octokit.request(
    `POST /repos/${process.env.GIT_USER}/${process.env.GIT_REPO}/issues`,
    {
      owner: 'jhkim',
      title: title,
      body: body,
    }
  );
};
