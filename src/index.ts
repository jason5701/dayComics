import 'dotenv/config';
import axios from 'axios';
import { load } from 'cheerio';
import { createIssue } from './issue/createIssue';

type Result = {
  date: string;
  title: any;
  url?: string;
};

const comics: string[] = [
  '일렉시드',
  '요신기',
  '불패검선',
  '천마는-평범하게-살-수-없다',
  '주말-도미-시식회',
  '호랑이형님',
  '무사만리행',
  '나노마신',
  '북검전기',
  '시간이-머문-집',
  '샤크',
  '미래의-골동품-가게',
  '화산귀환',
  '초인의-시대',
  '전지적-독자-시점',
  '신의-탑',
  '아비무쌍'
];

const today = new Date(Date.now()).toISOString().substring(0, 10);

export class Scraper {
  async scrapeManga(name: string) {
    let result: Result[] = [];

    const response = await axios.get(`https://toonkor176.com/${name}`);
    const html = response.data;

    const $ = load(html);

    $('#fboardlist > table > tbody > tr').map((i, element) => {
      const date = $(element).find('td:nth-child(3)').text();
      if (date >= today) {
        const title = $(element)
          .find('td:nth-child(2)')
          .text()
          .replace(/\n|\t/g, '');

        const url = $(element).find('td:nth-child(2)').attr('data-role');
        result.push({ date: date, title: title, url: url });
      }
    });

    // console.log(result);
    return result;
  }
}

const main = async () => {
  const scraper = new Scraper();

  const result = comics.map(async (comic: string) => {
    const response = await scraper.scrapeManga(comic);

    return [...response];
  });

  let body: string = '';
  let isCheck: boolean = false;
  for await (let item of result) {
    if (item.length > 0) {
      isCheck = true;
      item.forEach((i) => {
        body += `${i.title}, <a href='https://toonkor176.com/${i.url}'>바로가기</a><br/>\n`;
      });
    }
  }
  if (isCheck) await createIssue(`${today}`, body);
  else {
    console.info('nothing today');
    return;
  }
};

main();
