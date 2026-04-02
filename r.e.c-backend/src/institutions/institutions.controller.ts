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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.institutions.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInstitutionDto,
  ) {
    return this.institutions.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.institutions.delete(id);
  }

  @Get(':id/periods')
  listPeriods(@Param('id', ParseIntPipe) id: number) {
    return this.institutions.listPeriods(id);
  }

  @Get(':id/periods/active')
  getActivePeriod(@Param('id', ParseIntPipe) id: number) {
    return this.institutions.getActivePeriod(id);
  }

  @Post(':id/periods')
  createPeriod(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    dto: {
      nombre: string;
      codigo: string;
      tipo?: string;
      fechaInicio: string;
      fechaFin: string;
    },
  ) {
    return this.institutions.createPeriod(id, dto);
  }

  @Patch(':id/periods/:periodId/activate')
  activatePeriod(
    @Param('id', ParseIntPipe) id: number,
    @Param('periodId', ParseIntPipe) periodId: number,
  ) {
    return this.institutions.activatePeriod(id, periodId);
  }

  @Patch(':id/periods/:periodId/close')
  closePeriod(
    @Param('id', ParseIntPipe) id: number,
    @Param('periodId', ParseIntPipe) periodId: number,
  ) {
    return this.institutions.closePeriod(id, periodId);
  }
}
