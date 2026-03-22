import { PrismaClient } from '@prisma/client';

export async function cleanTestDb(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE "EvaluationGrade", "AcademicEvaluation", "PerformanceTopStudent", "GradePerformance", "StudentAcademicRecord", "RecoveryActivityAttachment", "RecoveryMessage", "RecoveryActivity", "RecoveryRequest", "RecoverySchedule", "RecoveryConfig", "ScheduleEvent", "ScheduleNote", "WeeklyScheduleEntry", "FeedbackImprovement", "FeedbackStrength", "Feedback", "Notification", "Message", "Syllabus", "StudyMaterial", "TeacherOfferingAssignment", "TeacherAssignment", "AcademicOffering", "GroupSubject", "StudentGroup", "GroupInfoLink", "GroupInfoMetric", "GroupInfoHighlight", "GroupInfo", "Subject", "Group", "Grade", "AcademicPeriod", "User", "Institution" RESTART IDENTITY CASCADE',
  );
}
