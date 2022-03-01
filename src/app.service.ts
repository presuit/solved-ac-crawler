import { Injectable } from '@nestjs/common';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { createObjectCsvWriter } from 'csv-writer';

interface CVSData {
  idx: string;
  id: string;
}

interface CSVResult {
  user_id: number;
  problem_id: number;
}

const csvHeader = ['user_id', 'problem_id'].map((header) => {
  return { id: header, title: header };
});

@Injectable()
export class AppService {
  async getHello(): Promise<void> {
    const results: CVSData[] = [];
    const filePath = path.resolve(
      process.cwd(),
      'src',
      'assets',
      'users_df_301-350.csv',
    );
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        if (results.length > 0) {
          await this.getUserSolvedProblems(results);
        }
      });
  }

  async getUserSolvedProblems(userData: CVSData[]): Promise<void> {
    const browser = await puppeteer.launch({ headless: true });
    const dataoffset = 30;
    const maxIndex = Math.ceil(userData.length / dataoffset);
    const container: CSVResult[] = [];

    console.log(`maxIndex: ${maxIndex}`);

    for (let i = 0; i < maxIndex; i++) {
      const results: CSVResult[] = await this.crawlUserSolvedProblems(
        userData.slice(i * dataoffset, i * dataoffset + dataoffset),
        browser,
      );
      container.push(...results);
    }

    const csvWriter = createObjectCsvWriter({
      header: csvHeader,
      path: './rating_df_301-350.csv',
    });

    await csvWriter.writeRecords(container);
    console.log('csv write done!');

    await browser.close();
  }

  async crawlUserSolvedProblems(
    userData: CVSData[],
    browser: puppeteer.Browser,
  ): Promise<CSVResult[]> {
    const data = userData.map((data) => {
      return new Promise<CSVResult[]>(async (resolve, _) => {
        try {
          const page = await browser.newPage();
          await page.goto(`https://www.acmicpc.net/user/${data.id}`);
          const problems = await page.evaluate(() => {
            const results: string[] = [];
            const list = document.querySelector(
              'body > div.wrapper > div.container.content > div.row > div:nth-child(2) > div > div.col-md-9 > div:nth-child(2) > div.panel-body > div',
            );
            if (list) {
              for (const item of list.children as any) {
                results.push(item.innerText);
              }
            }
            return results;
          });
          await page.close();
          console.log(
            `${data.id}님이 푸신 문제의 갯수는 ${problems.length}개 입니다!`,
          );

          const results: CSVResult[] = problems.map((problemId) => {
            return { problem_id: +problemId, user_id: +data.idx };
          });
          resolve(results);
        } catch (error) {
          console.log(error);
        }
      });
    });

    const results = await Promise.all(data);
    return results.flat();
  }

  async checkCSVWorking(): Promise<any> {
    const results = [];
    const filePath = path.resolve(process.cwd(), 'users_solved_301-350.csv');
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(results);
      });
  }
}
