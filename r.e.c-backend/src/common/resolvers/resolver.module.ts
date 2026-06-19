import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PublicIdResolver } from './public-id.resolver';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [PublicIdResolver],
  exports: [PublicIdResolver],
})
export class ResolverModule {}
