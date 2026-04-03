import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/dto/user-role.enum';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { ProvisionInstitutionDto } from './dto/provision-institution.dto';

@Controller('institutions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class InstitutionsController {
  constructor(private readonly institutions: InstitutionsService) {}

  @Post()
  create(@Body() dto: CreateInstitutionDto) {
    return this.institutions.create(dto);
  }

  @Post('provision')
  provision(@Body() dto: ProvisionInstitutionDto) {
    return this.institutions.provision(dto);
  }

  @Get()
  findAll() {
    return this.institutions.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.institutions.findOneByPublicId(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInstitutionDto) {
    return this.institutions.updateByPublicId(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.institutions.deleteByPublicId(id);
  }

  @Get(':id/periods')
  listPeriods(@Param('id') id: string) {
    return this.institutions.listPeriodsByPublicId(id);
  }

  @Get(':id/periods/active')
  getActivePeriod(@Param('id') id: string) {
    return this.institutions.getActivePeriodByPublicId(id);
  }

  @Post(':id/periods')
  createPeriod(
    @Param('id') id: string,
    @Body()
    dto: {
      nombre: string;
      codigo: string;
      tipo?: string;
      fechaInicio: string;
      fechaFin: string;
    },
  ) {
    return this.institutions.createPeriodByPublicId(id, dto);
  }

  @Patch(':id/periods/:periodId/activate')
  activatePeriod(
    @Param('id') id: string,
    @Param('periodId', ParseIntPipe) periodId: number,
  ) {
    return this.institutions.activatePeriodByPublicId(id, periodId);
  }

  @Patch(':id/periods/:periodId/close')
  closePeriod(
    @Param('id') id: string,
    @Param('periodId', ParseIntPipe) periodId: number,
  ) {
    return this.institutions.closePeriodByPublicId(id, periodId);
  }
}
