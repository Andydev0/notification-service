import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [PrismaModule, MetricsModule],
  providers: [WorkerService],
})
export class WorkerModule {}
