import { Module } from '@nestjs/common';
import { DbModule } from './db.module';
import { TicketsController } from './tickets/tickets.controller';
import { ReportsController } from './reports/reports.controller';
import { HealthcheckController } from './healthcheck/healthcheck.controller';
import { ReportsService } from './reports/reports.service';
import { ReportsServiceV2 } from './reports/v2/reports.service';
import { ReportsControllerV2 } from './reports/v2/reports.controller';

@Module({
  imports: [DbModule],
  controllers: [TicketsController, ReportsController, ReportsControllerV2, HealthcheckController],
  providers: [ReportsService, ReportsServiceV2],
})
export class AppModule {}
