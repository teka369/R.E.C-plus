export type PromoteGradeDto = {
  sourceGradeId: number;
  targetGradeId: number;
  mappings: {
    sourceGroupId: number;
    targetGroupId: number;
    repeatStudentIds: number[];
  }[];
};
