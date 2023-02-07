import 'dotenv/config';
import { Octokit } from '@octokit/core';

const octokit = new Octokit({ auth: process.env.ACCESS_TOKEN });

export const createIssue = async (title: string, body: string) => {
  await octokit.request(`POST /repos/{owner}/{repo}/issues`, {
    owner: process.env.GIT_USER as string,
    repo: process.env.GIT_REPO as string,
    title: title,
    body: body,
  });
};

export const getIssues = async () => {
  let titles = await octokit
    .request(`GET /repos/{owner}/{repo}/issues`, {
      owner: process.env.GIT_USER as string,
      repo: process.env.GIT_REPO as string,
    })
    .then((response) => {
      let arr = String(response.data[0].body).split(',');

      let titleList: string[] = [];
      for (let i = 0; i < arr.length; i++) {
        const title = arr[i].replace(/\n|\r\n|\r|\n\r/g, '');
        titleList.push(title);
      }

      return titleList;
    })
    .catch((error) => console.error(error));

  return titles;
};
