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
};

const today = new Date(Date.now()).toISOString().substring(0, 10);

export class Scraper {
  async scrapeManga(name: string) {
    let result: Result[] = [];

    const response = await axios.get(baseUrl+name);
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

export class Send {
  async telegram(chat_id: string, message: string) {
    const bot = new TelegramBot(process.env.TELEGRAM_TOKEN as string);

    bot
      .sendMessage(chat_id, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      })
      .catch((error) => console.error(error));
    console.info('send msg telegram');
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
        body += `${i.title}, <a href='${baseUrl}${i.url}'>바로가기</a><br/>\n`;
        msg += `[${i.title}](${baseUrl}${i.url})\n`;
      });
    }
  }
  // console.log(body)
  // console.log(msg)
  if (isCheck) {
    await createIssue(`${today}`, body);
  } else {
    console.info('nothing today');
    msg = '새로운 웹툰이 없습니다';
  }
  send.telegram(process.env.CHAT_ID as string, msg);
};

main();
