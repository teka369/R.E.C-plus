import {
  Body,
  Controller,
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
}
