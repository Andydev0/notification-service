import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private processed = 0;
  private failed = 0;

  incrementProcessed() {
    this.processed++;
  }

  incrementFailed() {
    this.failed++;
  }

  getMetrics() {
    return {
      processed: this.processed,
      failed: this.failed,
    };
  }
}
