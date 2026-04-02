import { ForbiddenException } from '@nestjs/common';
import { AcademicController } from '../../../src/academic/academic.controller';
import { AcademicService } from '../../../src/academic/academic.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('AcademicController', () => {
  let controller: AcademicController;
  let service: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.SECRETARIA, institutionId: 1 };
  const req = { user: actor } as any;
  const studentReq = {
    user: { userId: 5, role: UserRole.ESTUDIANTE, institutionId: 1 },
  } as any;

  beforeEach(() => {
    service = {
      createGrade: jest.fn(),
      listGrades: jest.fn(),
      getGrade: jest.fn(),
      updateGrade: jest.fn(),
      deleteGrade: jest.fn(),
      createGroup: jest.fn(),
      listGroups: jest.fn(),
      getGroup: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
      assignGroupDirector: jest.fn(),
      createSubject: jest.fn(),
      listSubjects: jest.fn(),
      getSubject: jest.fn(),
      updateSubject: jest.fn(),
      deleteSubject: jest.fn(),
      assignSubjectToGroup: jest.fn(),
      listGroupSubjects: jest.fn(),
      listGroupStudents: jest.fn(),
      deleteGroupSubject: jest.fn(),
      assignStudentToGroup: jest.fn(),
      getStudentGroup: jest.fn(),
      deleteStudentGroup: jest.fn(),
      listStudentSubjects: jest.fn(),
      promoteGrade: jest.fn(),
      previewPromoteGrade: jest.fn(),
      assignTeacher: jest.fn(),
      listTeacherAssignments: jest.fn(),
      deleteTeacherAssignment: jest.fn(),
      listTeacherOfferings: jest.fn(),
      listAcademicPeriods: jest.fn(),
      getActivePeriod: jest.fn(),
      getAcademicPeriod: jest.fn(),
      createAcademicPeriod: jest.fn(),
      updateAcademicPeriod: jest.fn(),
      activateAcademicPeriod: jest.fn(),
      closeAcademicPeriod: jest.fn(),
      listGroupOfferings: jest.fn(),
      getOfferingDetail: jest.fn(),
      listEvaluations: jest.fn(),
      createEvaluation: jest.fn(),
      updateEvaluation: jest.fn(),
      deleteEvaluation: jest.fn(),
    };
    controller = new AcademicController(service as unknown as AcademicService);
  });

  // Grades
  it('createGrade delegates', () => {
    controller.createGrade({ nombre: 'G1' }, req);
    expect(service.createGrade).toHaveBeenCalledWith(actor, { nombre: 'G1' });
  });

  it('listGrades delegates', () => {
    controller.listGrades(req, { page: 1, limit: 10 });
    expect(service.listGrades).toHaveBeenCalledWith(actor, {
      page: 1,
      limit: 10,
    });
  });

  it('getGrade delegates', () => {
    controller.getGrade(1, req);
    expect(service.getGrade).toHaveBeenCalledWith(actor, 1);
  });

  it('updateGrade delegates', () => {
    controller.updateGrade(1, { nombre: 'G2' }, req);
    expect(service.updateGrade).toHaveBeenCalledWith(actor, 1, {
      nombre: 'G2',
    });
  });

  it('deleteGrade delegates', () => {
    controller.deleteGrade(1, req);
    expect(service.deleteGrade).toHaveBeenCalledWith(actor, 1);
  });

  // Groups
  it('createGroup delegates', () => {
    controller.createGroup({ nombre: 'Gr', gradeId: 1 }, req);
    expect(service.createGroup).toHaveBeenCalledWith(actor, {
      nombre: 'Gr',
      gradeId: 1,
    });
  });

  it('listGroups delegates', () => {
    controller.listGroups(req, { page: 1, limit: 5 });
    expect(service.listGroups).toHaveBeenCalledWith(actor, {
      page: 1,
      limit: 5,
    });
  });

  it('getGroup delegates', () => {
    controller.getGroup(2, req);
    expect(service.getGroup).toHaveBeenCalledWith(actor, 2);
  });

  it('updateGroup delegates', () => {
    controller.updateGroup(2, { nombre: 'Updated' }, req);
    expect(service.updateGroup).toHaveBeenCalledWith(actor, 2, {
      nombre: 'Updated',
    });
  });

  it('deleteGroup delegates', () => {
    controller.deleteGroup(2, req);
    expect(service.deleteGroup).toHaveBeenCalledWith(actor, 2);
  });

  it('assignGroupDirector delegates', () => {
    controller.assignGroupDirector(1, { directorId: 5 }, req);
    expect(service.assignGroupDirector).toHaveBeenCalledWith(actor, 1, 5);
  });

  // Subjects
  it('createSubject delegates', () => {
    controller.createSubject({ nombre: 'Math', codigo: 'M01' }, req);
    expect(service.createSubject).toHaveBeenCalledWith(actor, {
      nombre: 'Math',
      codigo: 'M01',
    });
  });

  it('listSubjects delegates', () => {
    controller.listSubjects(req, { page: 1 });
    expect(service.listSubjects).toHaveBeenCalledWith(actor, { page: 1 });
  });

  it('getSubject delegates', () => {
    controller.getSubject(3, req);
    expect(service.getSubject).toHaveBeenCalledWith(actor, 3);
  });

  it('updateSubject delegates', () => {
    controller.updateSubject(3, { nombre: 'Sci' }, req);
    expect(service.updateSubject).toHaveBeenCalledWith(actor, 3, {
      nombre: 'Sci',
    });
  });

  it('deleteSubject delegates', () => {
    controller.deleteSubject(3, req);
    expect(service.deleteSubject).toHaveBeenCalledWith(actor, 3);
  });

  // Group subjects
  it('assignSubjectToGroup delegates', () => {
    controller.assignSubjectToGroup({ groupId: 1, subjectId: 2 }, req);
    expect(service.assignSubjectToGroup).toHaveBeenCalledWith(actor, {
      groupId: 1,
      subjectId: 2,
    });
  });

  it('listGroupSubjects delegates', () => {
    controller.listGroupSubjects(1, req);
    expect(service.listGroupSubjects).toHaveBeenCalledWith(actor, 1);
  });

  it('listGroupStudents delegates', () => {
    controller.listGroupStudents(1, req);
    expect(service.listGroupStudents).toHaveBeenCalledWith(actor, 1);
  });

  it('deleteGroupSubject delegates', () => {
    controller.deleteGroupSubject(5, req);
    expect(service.deleteGroupSubject).toHaveBeenCalledWith(actor, 5);
  });

  // Students
  it('assignStudentToGroup delegates', () => {
    controller.assignStudentToGroup({ studentId: 1, groupId: 2 }, req);
    expect(service.assignStudentToGroup).toHaveBeenCalledWith(actor, {
      studentId: 1,
      groupId: 2,
    });
  });

  it('updateStudentGroup delegates', () => {
    controller.updateStudentGroup(5, { groupId: 3 }, req);
    expect(service.assignStudentToGroup).toHaveBeenCalledWith(actor, {
      studentId: 5,
      groupId: 3,
    });
  });

  it('getStudentGroup — allowed for SECRETARIA', () => {
    controller.getStudentGroup(10, req);
    expect(service.getStudentGroup).toHaveBeenCalledWith(actor, 10);
  });

  it('getStudentGroup — allowed for own studentId', () => {
    controller.getStudentGroup(5, studentReq);
    expect(service.getStudentGroup).toHaveBeenCalledWith(studentReq.user, 5);
  });

  it('getStudentGroup — throws for another student', () => {
    expect(() => controller.getStudentGroup(10, studentReq)).toThrow(
      ForbiddenException,
    );
  });

  it('deleteStudentGroup delegates', () => {
    controller.deleteStudentGroup(5, req);
    expect(service.deleteStudentGroup).toHaveBeenCalledWith(actor, 5);
  });

  it('listStudentSubjects — allowed for SECRETARIA', () => {
    controller.listStudentSubjects(10, req);
    expect(service.listStudentSubjects).toHaveBeenCalledWith(actor, 10);
  });

  it('listStudentSubjects — throws for another student', () => {
    expect(() => controller.listStudentSubjects(10, studentReq)).toThrow(
      ForbiddenException,
    );
  });

  // Promotions
  it('promoteGrade delegates', () => {
    const dto = { gradeId: 1 } as any;
    controller.promoteGrade(dto, req);
    expect(service.promoteGrade).toHaveBeenCalledWith(actor, dto);
  });

  it('previewPromoteGrade delegates', () => {
    const dto = { gradeId: 1 } as any;
    controller.previewPromoteGrade(dto, req);
    expect(service.previewPromoteGrade).toHaveBeenCalledWith(actor, dto);
  });

  // Teachers
  it('assignTeacher delegates', () => {
    controller.assignTeacher({ teacherId: 1, groupId: 2, subjectId: 3 }, req);
    expect(service.assignTeacher).toHaveBeenCalledWith(actor, {
      teacherId: 1,
      groupId: 2,
      subjectId: 3,
    });
  });

  it('listTeacherAssignments delegates', () => {
    controller.listTeacherAssignments(1, req);
    expect(service.listTeacherAssignments).toHaveBeenCalledWith(actor, 1);
  });

  it('deleteTeacherAssignment delegates', () => {
    controller.deleteTeacherAssignment(5, req);
    expect(service.deleteTeacherAssignment).toHaveBeenCalledWith(actor, 5);
  });

  it('listTeacherOfferings passes periodId', () => {
    controller.listTeacherOfferings(1, '2', req);
    expect(service.listTeacherOfferings).toHaveBeenCalledWith(actor, 1, 2);
  });

  it('listTeacherOfferings handles undefined periodId', () => {
    controller.listTeacherOfferings(1, undefined, req);
    expect(service.listTeacherOfferings).toHaveBeenCalledWith(
      actor,
      1,
      undefined,
    );
  });

  // Periods
  it('listAcademicPeriods delegates', () => {
    controller.listAcademicPeriods(req, { page: 1 });
    expect(service.listAcademicPeriods).toHaveBeenCalledWith(actor, {
      page: 1,
    });
  });

  it('getActivePeriod delegates', () => {
    controller.getActivePeriod(req);
    expect(service.getActivePeriod).toHaveBeenCalledWith(actor);
  });

  it('getAcademicPeriod delegates', () => {
    controller.getAcademicPeriod(1, req);
    expect(service.getAcademicPeriod).toHaveBeenCalledWith(actor, 1);
  });

  it('createAcademicPeriod delegates', () => {
    const dto = {
      nombre: 'P1',
      codigo: 'C1',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-06-30',
    };
    controller.createAcademicPeriod(dto, req);
    expect(service.createAcademicPeriod).toHaveBeenCalledWith(actor, dto);
  });

  it('updateAcademicPeriod delegates', () => {
    controller.updateAcademicPeriod(1, { nombre: 'P2' }, req);
    expect(service.updateAcademicPeriod).toHaveBeenCalledWith(actor, 1, {
      nombre: 'P2',
    });
  });

  it('activateAcademicPeriod delegates', () => {
    controller.activateAcademicPeriod(1, req);
    expect(service.activateAcademicPeriod).toHaveBeenCalledWith(actor, 1);
  });

  it('closeAcademicPeriod delegates', () => {
    controller.closeAcademicPeriod(1, req);
    expect(service.closeAcademicPeriod).toHaveBeenCalledWith(actor, 1);
  });

  // Offerings
  it('listGroupOfferings passes periodId', () => {
    controller.listGroupOfferings(1, '2', req);
    expect(service.listGroupOfferings).toHaveBeenCalledWith(actor, 1, 2);
  });

  it('getOfferingDetail delegates', () => {
    controller.getOfferingDetail(1, req);
    expect(service.getOfferingDetail).toHaveBeenCalledWith(actor, 1);
  });

  // Evaluations
  it('listEvaluations delegates', () => {
    controller.listEvaluations(1, req);
    expect(service.listEvaluations).toHaveBeenCalledWith(actor, 1);
  });

  it('createEvaluation delegates', () => {
    const dto = { titulo: 'E1', porcentaje: 50 };
    controller.createEvaluation(1, dto, req);
    expect(service.createEvaluation).toHaveBeenCalledWith(actor, 1, dto);
  });

  it('updateEvaluation delegates', () => {
    controller.updateEvaluation(1, { titulo: 'E2' }, req);
    expect(service.updateEvaluation).toHaveBeenCalledWith(actor, 1, {
      titulo: 'E2',
    });
  });

  it('deleteEvaluation delegates', () => {
    controller.deleteEvaluation(1, req);
    expect(service.deleteEvaluation).toHaveBeenCalledWith(actor, 1);
  });
});
