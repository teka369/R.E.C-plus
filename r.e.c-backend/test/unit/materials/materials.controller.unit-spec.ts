import { MaterialsController } from '../../../src/materials/materials.controller';
import { MaterialsService } from '../../../src/materials/materials.service';
import { UserRole } from '../../../src/users/dto/user-role.enum';

describe('MaterialsController', () => {
  let controller: MaterialsController;
  let service: Record<string, jest.Mock>;

  const actor = { userId: 1, role: UserRole.PROFESOR, institutionId: 1 };
  const req = { user: actor } as any;

  beforeEach(() => {
    service = {
      createStudyMaterial: jest.fn(),
      uploadStudyFile: jest.fn(),
      listStudyMaterials: jest.fn(),
      getStudyMaterial: jest.fn(),
      getStudyFile: jest.fn(),
      incrementStudyViews: jest.fn(),
      incrementStudyDownloads: jest.fn(),
      updateStudyMaterial: jest.fn(),
      deleteStudyMaterial: jest.fn(),
      createSyllabus: jest.fn(),
      listSyllabi: jest.fn(),
      getSyllabus: jest.fn(),
      updateSyllabus: jest.fn(),
      deleteSyllabus: jest.fn(),
      getGroupInfo: jest.fn(),
      updateGroupInfo: jest.fn(),
      listGradeLeagues: jest.fn(),
    };
    controller = new MaterialsController(
      service as unknown as MaterialsService,
    );
  });

  // Study materials
  it('createStudy delegates', () => {
    const dto = { titulo: 'M' } as any;
    controller.createStudy(dto, req);
    expect(service.createStudyMaterial).toHaveBeenCalledWith(actor, dto);
  });

  it('uploadStudyFile delegates', () => {
    const file = {
      originalname: 'f.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from(''),
    };
    controller.uploadStudyFile(file, 1, 2, req);
    expect(service.uploadStudyFile).toHaveBeenCalledWith(actor, 1, 2, file);
  });

  it('listStudy delegates with pagination', () => {
    controller.listStudy('2', '10', req);
    expect(service.listStudyMaterials).toHaveBeenCalledWith(actor, {
      page: 2,
      limit: 10,
    });
  });

  it('listStudy handles undefined pagination', () => {
    controller.listStudy(undefined, undefined, req);
    expect(service.listStudyMaterials).toHaveBeenCalledWith(actor, {
      page: undefined,
      limit: undefined,
    });
  });

  it('getStudy delegates', () => {
    controller.getStudy(5, req);
    expect(service.getStudyMaterial).toHaveBeenCalledWith(actor, 5);
  });

  it('getStudyFile delegates and sets headers', async () => {
    service.getStudyFile.mockResolvedValue({
      mimeType: 'application/pdf',
      originalName: 'test.pdf',
      fileContent: Buffer.from('pdf'),
    });
    const res = {
      setHeader: jest.fn(),
    } as any;
    const result = await controller.getStudyFile(1, req, res);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'inline; filename="test.pdf"',
    );
    expect(result).toBeDefined();
  });

  it('getStudyFile sanitizes filename with special chars', async () => {
    service.getStudyFile.mockResolvedValue({
      mimeType: 'text/plain',
      originalName: 'file\r\n"test.txt',
      fileContent: Buffer.from('x'),
    });
    const res = { setHeader: jest.fn() } as any;
    await controller.getStudyFile(1, req, res);
    const disposition = res.setHeader.mock.calls.find(
      (c: string[]) => c[0] === 'Content-Disposition',
    )[1];
    expect(disposition).not.toContain('\r');
    expect(disposition).not.toContain('\n');
  });

  it('incrementStudyViews delegates', () => {
    controller.incrementStudyViews(5, req);
    expect(service.incrementStudyViews).toHaveBeenCalledWith(actor, 5);
  });

  it('incrementStudyDownloads delegates', () => {
    controller.incrementStudyDownloads(5, req);
    expect(service.incrementStudyDownloads).toHaveBeenCalledWith(actor, 5);
  });

  it('updateStudy delegates', () => {
    const dto = { titulo: 'Updated' } as any;
    controller.updateStudy(5, dto, req);
    expect(service.updateStudyMaterial).toHaveBeenCalledWith(actor, 5, dto);
  });

  it('deleteStudy delegates', () => {
    controller.deleteStudy(5, req);
    expect(service.deleteStudyMaterial).toHaveBeenCalledWith(actor, 5);
  });

  // Syllabi
  it('createSyllabus delegates', () => {
    const dto = { titulo: 'S' } as any;
    controller.createSyllabus(dto, req);
    expect(service.createSyllabus).toHaveBeenCalledWith(actor, dto);
  });

  it('listSyllabi delegates', () => {
    controller.listSyllabi(req);
    expect(service.listSyllabi).toHaveBeenCalledWith(actor);
  });

  it('getSyllabus delegates', () => {
    controller.getSyllabus(1, req);
    expect(service.getSyllabus).toHaveBeenCalledWith(actor, 1);
  });

  it('updateSyllabus delegates', () => {
    const dto = { titulo: 'Updated' } as any;
    controller.updateSyllabus(1, dto, req);
    expect(service.updateSyllabus).toHaveBeenCalledWith(actor, 1, dto);
  });

  it('deleteSyllabus delegates', () => {
    controller.deleteSyllabus(1, req);
    expect(service.deleteSyllabus).toHaveBeenCalledWith(actor, 1);
  });

  // Group Info
  it('getGroupInfo delegates', () => {
    controller.getGroupInfo(1, req);
    expect(service.getGroupInfo).toHaveBeenCalledWith(actor, 1);
  });

  it('updateGroupInfo delegates', () => {
    const dto = { liga: 'Gold' } as any;
    controller.updateGroupInfo(1, dto, req);
    expect(service.updateGroupInfo).toHaveBeenCalledWith(actor, 1, dto);
  });

  it('listLeagues delegates', () => {
    controller.listLeagues(1, req);
    expect(service.listGradeLeagues).toHaveBeenCalledWith(actor, 1);
  });
});
