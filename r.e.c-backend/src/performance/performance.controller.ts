import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { PerformanceService } from './performance.service';
import { UpsertGradePerformanceDto } from './dto/performance.dto';

type AuthenticatedRequest = {
  user: {
    userId: number;
    role: UserRole;
  };
};

@Controller('performance')
@ApiTags('Performance')
@ApiBearerAuth()
export class PerformanceController {
  constructor(private readonly performance: PerformanceService) {}

  @UseGuards(JwtAuthGuard)
  @Get('grades/:grade')
  getByGrade(@Param('grade') grade: string) {
    return this.performance.getByGrade(grade);
  }

  @UseGuards(JwtAuthGuard)
  @Get('groups/:groupId')
  getByGroup(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.performance.getByGroup(groupId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESOR, UserRole.SECRETARIA)
  @Post('grades/:grade')
  upsertByGrade(
    @Param('grade') grade: string,
    @Body() dto: UpsertGradePerformanceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.performance.upsertByGrade(req.user, grade, dto);
  }
}
