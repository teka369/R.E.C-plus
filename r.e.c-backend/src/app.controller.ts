import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  getRoot(): string {
    return 'R.E.C Backend API is running. Please refer to the documentation for available endpoints.';
  }

  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'r.e.c-backend' };
  }
}
