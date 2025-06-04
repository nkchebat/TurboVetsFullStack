export function formatTaskStatus(
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
): string {
  switch (status) {
    case 'TODO':
      return 'To Do';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'DONE':
      return 'Done';
    default:
      return status;
  }
}
