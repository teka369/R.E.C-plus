import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MaterialsService } from '../../../src/materials/materials.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';
import { Actor } from '../../../src/common/tenant';

// Mock only the promises API to avoid breaking Prisma client init
jest.mock('node:fs', () => {
  const actual = jest.requireActual('node:fs');
  return {
    ...actual,
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      unlink: jest.fn().mockResolvedValue(undefined),
      readdir: jest.fn().mockResolvedValue([]),
      rmdir: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue(Buffer.from('test')),
    },
  };
});

jest.mock('node:crypto', () => {
  const actual = jest.requireActual('node:crypto');
  return { ...actual, randomUUID: () => 'test-uuid' };
});

describe('MaterialsService (unit)', () => {
  const prisma = {
    teacherAssignment: { findUnique: jest.fn(), findMany: jest.fn() },
    studentGroup: { findFirst: jest.fn() },
    group: { findFirst: jest.fn(), findMany: jest.fn() },
    studyMaterial: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    academicPeriod: { findFirst: jest.fn() },
    academicOffering: { findUnique: jest.fn() },
    syllabus: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupInfo: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    groupInfoHighlight: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    groupInfoMetric: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    groupInfoLink: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  let service: MaterialsService;

  const profesor: Actor = {
    userId: 5,
    role: UserRole.PROFESOR,
    institutionId: 1,
  };
  const secretaria: Actor = {
    userId: 10,
    role: UserRole.SECRETARIA,
    institutionId: 1,
  };
  const superAdmin: Actor = { userId: 1, role: UserRole.SUPER_ADMIN };
  const estudiante: Actor = {
    userId: 20,
    role: UserRole.ESTUDIANTE,
    institutionId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MaterialsService(prisma as never);
  });

  // ======================================================
  // ensureTeacherAssignment (via uploadStudyFile, createStudyMaterial)
  // ======================================================
  describe('uploadStudyFile', () => {
    it('rechaza si no es profesor', async () => {
      await expect(
        service.uploadStudyFile(secretaria, 1, 1, {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.alloc(100),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('sube archivo válido', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
      });

      const result = await service.uploadStudyFile(profesor, 5, 3, {
        originalname: 'material.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(1024),
      });

      expect(result.filePath).toContain('study-materials');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('rechaza archivo demasiado grande', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
      });

      await expect(
        service.uploadStudyFile(profesor, 5, 3, {
          originalname: 'big.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.alloc(26 * 1024 * 1024),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza tipo MIME no permitido', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
      });

      await expect(
        service.uploadStudyFile(profesor, 5, 3, {
          originalname: 'script.exe',
          mimetype: 'application/x-executable',
          buffer: Buffer.alloc(100),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza archivo inválido (sin buffer)', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
      });

      await expect(
        service.uploadStudyFile(profesor, 5, 3, {
          originalname: '',
          mimetype: '',
          buffer: null as never,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si no está asignado al grupo/materia', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadStudyFile(profesor, 5, 3, {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.alloc(100),
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ======================================================
  // Study Materials CRUD
  // ======================================================
  describe('createStudyMaterial', () => {
    it('crea material de estudio', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
      });
      prisma.studyMaterial.create.mockResolvedValue({
        id: 1,
        title: 'Guía Cap 1',
      });
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      const result = await service.createStudyMaterial(profesor, {
        groupId: 5,
        subjectId: 3,
        title: 'Guía Cap 1',
        type: 'DOCUMENT',
        visibility: 'GROUP',
      } as never);

      expect(result.title).toBe('Guía Cap 1');
    });

    it('enlaza a offering si hay período activo', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
      });
      prisma.studyMaterial.create.mockResolvedValue({ id: 1 });
      prisma.academicPeriod.findFirst.mockResolvedValue({ id: 10 });
      prisma.academicOffering.findUnique.mockResolvedValue({ id: 20 });
      prisma.studyMaterial.update.mockResolvedValue({
        id: 1,
        academicOfferingId: 20,
      });

      const result = await service.createStudyMaterial(profesor, {
        groupId: 5,
        subjectId: 3,
        title: 'X',
        type: 'DOCUMENT',
        visibility: 'GROUP',
      } as never);

      expect(result.academicOfferingId).toBe(20);
    });
  });

  describe('updateStudyMaterial', () => {
    it('actualiza material propio', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        teacherId: profesor.userId,
      });
      prisma.studyMaterial.update.mockResolvedValue({
        id: 1,
        title: 'Editado',
      });

      const result = await service.updateStudyMaterial(profesor, 1, {
        title: 'Editado',
      } as never);

      expect(result.title).toBe('Editado');
    });

    it('rechaza si no es el autor', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 999,
      });

      await expect(
        service.updateStudyMaterial(profesor, 1, { title: 'X' } as never),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStudyMaterial(profesor, 999, { title: 'X' } as never),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteStudyMaterial', () => {
    it('elimina material propio', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        teacherId: profesor.userId,
        filePath: null,
      });
      prisma.studyMaterial.delete.mockResolvedValue({});

      const result = await service.deleteStudyMaterial(profesor, 1);

      expect(result).toEqual({ deleted: true });
    });

    it('elimina archivo físico si existe', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        teacherId: profesor.userId,
        filePath: 'study-materials/teacher-5/2026-01/file.pdf',
      });
      prisma.studyMaterial.delete.mockResolvedValue({});

      const result = await service.deleteStudyMaterial(profesor, 1);

      expect(result).toEqual({ deleted: true });
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue(null);

      await expect(service.deleteStudyMaterial(profesor, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si no es el autor', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 999,
      });

      await expect(service.deleteStudyMaterial(profesor, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('listStudyMaterials', () => {
    it('retorna todos los materiales para SUPER_ADMIN', async () => {
      prisma.studyMaterial.findMany.mockResolvedValue([{ id: 1 }]);
      prisma.studyMaterial.count.mockResolvedValue(1);

      const result = await service.listStudyMaterials(superAdmin);

      expect(result.data).toHaveLength(1);
    });

    it('retorna materiales del profesor por asignaciones', async () => {
      prisma.teacherAssignment.findMany.mockResolvedValue([
        { groupId: 5, subjectId: 3 },
      ]);
      prisma.studyMaterial.findMany.mockResolvedValue([]);
      prisma.studyMaterial.count.mockResolvedValue(0);

      const result = await service.listStudyMaterials(profesor);

      expect(result.data).toEqual([]);
    });

    it('retorna materiales visibles para estudiante', async () => {
      prisma.studentGroup.findFirst.mockResolvedValue({
        groupId: 5,
      });
      prisma.group.findFirst.mockResolvedValue({ id: 5, gradeId: 2 });
      prisma.studyMaterial.findMany.mockResolvedValue([]);
      prisma.studyMaterial.count.mockResolvedValue(0);

      const result = await service.listStudyMaterials(estudiante);

      expect(result.data).toEqual([]);
    });
  });

  describe('getStudyMaterial', () => {
    it('retorna material para SUPER_ADMIN', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
        groupId: 5,
        subjectId: 3,
      });

      const result = await service.getStudyMaterial(superAdmin, 1);

      expect(result.id).toBe(1);
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue(null);

      await expect(service.getStudyMaterial(profesor, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si está fuera de la institución', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 99 },
      });

      await expect(service.getStudyMaterial(profesor, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('permite acceso a secretaria de misma institución', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
        groupId: 5,
        subjectId: 3,
      });

      const result = await service.getStudyMaterial(secretaria, 1);

      expect(result.id).toBe(1);
    });

    it('permite acceso a profesor asignado', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
        groupId: 5,
        subjectId: 3,
      });
      prisma.teacherAssignment.findUnique.mockResolvedValue({ id: 1 });

      const result = await service.getStudyMaterial(profesor, 1);

      expect(result.id).toBe(1);
    });

    it('rechaza profesor no asignado', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
        groupId: 5,
        subjectId: 3,
      });
      prisma.teacherAssignment.findUnique.mockResolvedValue(null);

      await expect(service.getStudyMaterial(profesor, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getStudyFile', () => {
    it('retorna contenido del archivo', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
        groupId: 5,
        subjectId: 3,
        filePath: 'study-materials/teacher-5/file.pdf',
      });

      const result = await service.getStudyFile(superAdmin, 1);

      expect(result.originalName).toBe('file.pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('lanza si material no tiene filePath', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
        groupId: 5,
        subjectId: 3,
        filePath: null,
      });

      await expect(service.getStudyFile(superAdmin, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('incrementStudyViews', () => {
    it('incrementa views', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
        groupId: 5,
        subjectId: 3,
      });
      prisma.studyMaterial.update.mockResolvedValue({
        id: 1,
        views: 5,
        downloads: 0,
      });

      const result = await service.incrementStudyViews(superAdmin, 1);

      expect(result.views).toBe(5);
    });
  });

  describe('incrementStudyDownloads', () => {
    it('incrementa downloads', async () => {
      prisma.studyMaterial.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
        groupId: 5,
        subjectId: 3,
      });
      prisma.studyMaterial.update.mockResolvedValue({
        id: 1,
        views: 0,
        downloads: 3,
      });

      const result = await service.incrementStudyDownloads(superAdmin, 1);

      expect(result.downloads).toBe(3);
    });
  });

  // ======================================================
  // Syllabus
  // ======================================================
  describe('createSyllabus', () => {
    it('crea temario', async () => {
      prisma.teacherAssignment.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
      });
      prisma.syllabus.create.mockResolvedValue({
        id: 1,
        title: 'Temario Mat',
      });
      prisma.academicPeriod.findFirst.mockResolvedValue(null);

      const result = await service.createSyllabus(profesor, {
        groupId: 5,
        subjectId: 3,
        title: 'Temario Mat',
      } as never);

      expect(result.title).toBe('Temario Mat');
    });

    it('rechaza si no es profesor', async () => {
      await expect(
        service.createSyllabus(secretaria, {
          groupId: 5,
          subjectId: 3,
          title: 'X',
        } as never),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateSyllabus', () => {
    it('actualiza temario propio', async () => {
      prisma.syllabus.findUnique.mockResolvedValue({
        id: 1,
        teacherId: profesor.userId,
      });
      prisma.syllabus.update.mockResolvedValue({ id: 1, title: 'Editado' });

      const result = await service.updateSyllabus(profesor, 1, {
        title: 'Editado',
      } as never);

      expect(result.title).toBe('Editado');
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.syllabus.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSyllabus(profesor, 999, {} as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza si no es el autor', async () => {
      prisma.syllabus.findUnique.mockResolvedValue({
        id: 1,
        teacherId: 999,
      });

      await expect(
        service.updateSyllabus(profesor, 1, {} as never),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteSyllabus', () => {
    it('elimina temario propio', async () => {
      prisma.syllabus.findUnique.mockResolvedValue({
        id: 1,
        teacherId: profesor.userId,
      });
      prisma.syllabus.delete.mockResolvedValue({});

      const result = await service.deleteSyllabus(profesor, 1);

      expect(result).toEqual({ deleted: true });
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.syllabus.findUnique.mockResolvedValue(null);

      await expect(service.deleteSyllabus(profesor, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listSyllabi', () => {
    it('retorna todos los temarios para secretaria', async () => {
      prisma.syllabus.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await service.listSyllabi(secretaria);

      expect(result).toHaveLength(1);
    });

    it('retorna temarios del profesor por asignaciones', async () => {
      prisma.teacherAssignment.findMany.mockResolvedValue([
        { groupId: 5, subjectId: 3 },
      ]);
      prisma.syllabus.findMany.mockResolvedValue([]);

      const result = await service.listSyllabi(profesor);

      expect(result).toEqual([]);
    });

    it('retorna temarios visibles para estudiante', async () => {
      prisma.studentGroup.findFirst.mockResolvedValue({ groupId: 5 });
      prisma.group.findFirst.mockResolvedValue({ id: 5, gradeId: 2 });
      prisma.syllabus.findMany.mockResolvedValue([]);

      const result = await service.listSyllabi(estudiante);

      expect(result).toEqual([]);
    });
  });

  describe('getSyllabus', () => {
    it('retorna temario para SUPER_ADMIN', async () => {
      prisma.syllabus.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 1 },
        groupId: 5,
        subjectId: 3,
      });

      const result = await service.getSyllabus(superAdmin, 1);

      expect(result.id).toBe(1);
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.syllabus.findUnique.mockResolvedValue(null);

      await expect(service.getSyllabus(profesor, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza si fuera de institución', async () => {
      prisma.syllabus.findUnique.mockResolvedValue({
        id: 1,
        group: { institutionId: 99 },
      });

      await expect(service.getSyllabus(profesor, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ======================================================
  // Group Info (Leagues)
  // ======================================================
  describe('getGroupInfo', () => {
    it('retorna info del grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 5 });
      prisma.groupInfo.findUnique.mockResolvedValue({
        groupId: 5,
        summary: 'Resumen',
        infoHighlights: [{ texto: 'H1', orden: 0 }],
        infoMetrics: [{ etiqueta: 'prom', valor: '4.5', orden: 0 }],
        infoLinks: [{ url: 'https://example.com', orden: 0 }],
      });

      const result = await service.getGroupInfo(secretaria, 5);

      expect(result.summary).toBe('Resumen');
      expect(result.highlights).toEqual(['H1']);
      expect(result.links).toEqual(['https://example.com']);
    });

    it('retorna valores por defecto si no hay info', async () => {
      prisma.group.findFirst.mockResolvedValue({ id: 5 });
      prisma.groupInfo.findUnique.mockResolvedValue(null);

      const result = await service.getGroupInfo(secretaria, 5);

      expect(result.summary).toBeNull();
      expect(result.highlights).toEqual([]);
    });

    it('lanza NotFoundException si grupo no existe', async () => {
      prisma.group.findFirst.mockResolvedValue(null);

      await expect(service.getGroupInfo(secretaria, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateGroupInfo', () => {
    it('actualiza info como director del grupo', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 5,
        directorId: profesor.userId,
      });
      prisma.groupInfo.upsert.mockResolvedValue({});
      // Mock getGroupInfo result after update
      prisma.groupInfo.findUnique.mockResolvedValue({
        groupId: 5,
        summary: 'Nuevo',
        infoHighlights: [],
        infoMetrics: [],
        infoLinks: [],
      });

      const result = await service.updateGroupInfo(profesor, 5, {
        summary: 'Nuevo',
      });

      expect(result.summary).toBe('Nuevo');
    });

    it('rechaza si no es director', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 5,
        directorId: 999,
      });

      await expect(
        service.updateGroupInfo(profesor, 5, { summary: 'X' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('sincroniza highlights', async () => {
      prisma.group.findFirst.mockResolvedValue({
        id: 5,
        directorId: profesor.userId,
      });
      prisma.groupInfo.upsert.mockResolvedValue({});
      prisma.groupInfoHighlight.deleteMany.mockResolvedValue({});
      prisma.groupInfoHighlight.createMany.mockResolvedValue({});
      prisma.groupInfo.findUnique.mockResolvedValue({
        groupId: 5,
        summary: null,
        infoHighlights: [{ texto: 'H1', orden: 0 }],
        infoMetrics: [],
        infoLinks: [],
      });

      const result = await service.updateGroupInfo(profesor, 5, {
        highlights: ['H1'],
      });

      expect(result.highlights).toEqual(['H1']);
    });
  });

  describe('listGradeLeagues', () => {
    it('retorna ligas del grado', async () => {
      prisma.group.findMany.mockResolvedValue([
        {
          id: 5,
          nombre: '1A',
          info: {
            summary: 'S',
            infoHighlights: [],
            infoMetrics: [],
            infoLinks: [],
          },
        },
        {
          id: 6,
          nombre: '1B',
          info: null,
        },
      ]);

      const result = await service.listGradeLeagues(secretaria, 1);

      expect(result).toHaveLength(2);
      expect(result[0].info.summary).toBe('S');
      expect(result[1].info.summary).toBeNull();
    });
  });
});
