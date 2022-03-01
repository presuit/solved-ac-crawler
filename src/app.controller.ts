import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Res() res: Response): Promise<any> {
    try {
      await this.appService.getHello();
    } catch (error) {
      console.log(error);
      return res.status(500).end();
    }
    return res.status(200).end();
  }

  @Get('/check-csv')
  async checkCSV(): Promise<any> {
    try {
      await this.appService.checkCSVWorking();
    } catch (error) {
      console.log(error);
    }
  }
}
