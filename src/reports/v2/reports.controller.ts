import { Controller, Get, Post, HttpCode, Response } from '@nestjs/common';
import { ReportsServiceV2 } from './reports.service';

@Controller('api/v2/reports')
export class ReportsControllerV2 {
  constructor(
    private reportsServiceV2: ReportsServiceV2,
  ) {}

  @Get()
  report() {
    return {
      'accounts.csv': this.reportsServiceV2.state('accounts'),
      'yearly.csv': this.reportsServiceV2.state('yearly'),
      'fs.csv': this.reportsServiceV2.state('fs'),
    };
  }

  @Post()
  @HttpCode(201)
  generate(@Response() res) {
    if (
      this.reportsServiceV2.state('accounts') === 'starting' ||
      this.reportsServiceV2.state('yearly') === 'starting' ||
      this.reportsServiceV2.state('fs') === 'starting'
    ) {
      return res.status(409).json({ message: 'reports are already being generated' });
    }

    this.reportsServiceV2.generate();

    res.status(201).json({ message: 'processing' });
  }
}
