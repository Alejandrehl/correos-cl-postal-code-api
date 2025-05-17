import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import {
  cleanup,
  close,
  CLEANUP_INTERVAL_MS,
} from '../../utils/browser-manager';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class BrowserCleanupService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private cleanupInterval: NodeJS.Timeout;

  constructor(private readonly logger: AppLogger) {}

  onApplicationBootstrap(): void {
    this.logger.log('Starting browser cleanup service...', 'BrowserCleanup');

    // Run cleanup every 30 minutes
    this.cleanupInterval = setInterval(async () => {
      try {
        await cleanup();
      } catch (error) {
        this.logger.error('Browser cleanup failed', error, 'BrowserCleanup');
      }
    }, CLEANUP_INTERVAL_MS);
  }

  onApplicationShutdown(): void {
    this.logger.log('Stopping browser cleanup service...', 'BrowserCleanup');

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all browsers when the application shuts down
    close().catch((error) => {
      this.logger.error(
        'Failed to close browsers during shutdown',
        error,
        'BrowserCleanup',
      );
    });
  }
}
