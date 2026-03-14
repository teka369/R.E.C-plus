import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/')
  getRoot(): string {
    return 'Hello World!';
  }

  @Get('/health')
  getHealth() {
    return { status: 'ok', service: 'r.e.c-backend' };
  }
}
