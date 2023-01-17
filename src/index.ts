import 'dotenv/config';
import axios from 'axios';
import { load } from 'cheerio';
import { createIssue } from './issue/createIssue';
import TelegramBot from 'node-telegram-bot-api';
import { comics, baseUrl } from './constants';

type Result = {
  date: string;
  title: any;
  url?: string;
  num: number;
};

const today = new Date(Date.now()).toISOString().substring(0, 10);
let isCheck: boolean = true;

export class Scraper {
  async scrapeManga(name: string) {
    let result: Result[] = [];
    let num: number = 176;
    let response: any = '';

    while (isCheck) {
      response = await axios
        .get(baseUrl(num) + name)
        .then((res) => {
          isCheck = false;
          return res.data;
        })
        .catch((error) => {
          num++;
          // console.error(error);
        });
    }

    if (response !== '') {
      const html = response;
      const $ = load(html);

      $('#fboardlist > table > tbody > tr').map((i, element) => {
        const date = $(element).find('td:nth-child(3)').text();
        if (date >= today) {
          const title = $(element)
            .find('td:nth-child(2)')
            .text()
            .replace(/\n|\t/g, '');

          const url = $(element).find('td:nth-child(2)').attr('data-role');
          result.push({ date: date, title: title, url: url, num: num });
        }
      });
    }

    // console.log(result);
    return result;
  }
}

export class Send {
  async telegram(chat_id: string, message: string) {
    const bot = new TelegramBot(process.env.TELEGRAM_TOKEN as string);

    bot
      .sendMessage(chat_id, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      })
      .catch((error) => console.error(error));
  }
}

const main = async () => {
  const scraper = new Scraper();
  const send = new Send();

  const result = comics.map(async (comic: string) => {
    const response = await scraper.scrapeManga(comic);

    return [...response];
  });

  let body: string = '';
  let isCheck: boolean = false;
  let msg: string = '';
  for await (let item of result) {
    if (item.length > 0) {
      isCheck = true;
      item.forEach((i) => {
        body += `${i.title}, <a href='${baseUrl(i.num)}${
          i.url
        }'>바로가기</a><br/>\n`;
        msg += `[${i.title}](${baseUrl(i.num)}${i.url})\n`;
      });
    }
  }
  console.log(body);
  console.log(msg);
  if (isCheck) {
    await createIssue(`${today}`, body);
  } else {
    console.info('nothing today');
    msg = '새로운 웹툰이 없습니다';
  }
  send.telegram(process.env.CHAT_ID as string, msg);
};

main();
