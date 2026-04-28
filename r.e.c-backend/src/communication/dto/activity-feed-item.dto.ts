export class ActivityFeedItemDto {
  type:
    | 'STUDENT_ENROLLED'
    | 'TEACHER_ASSIGNED'
    | 'GROUP_CREATED'
    | 'RECOVERY_REQUESTED'
    | 'USER_CREATED';
  description: string;
  date: string;
  href: string;
}
