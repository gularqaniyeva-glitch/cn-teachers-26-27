/** Ссылка на профиль учителя в LMS Algoritmika по его LMS ID */
export function getLmsProfileUrl(lmsId: string): string {
  return `https://lms.algoritmika.az/user/update/${encodeURIComponent(lmsId)}#course-assessment`;
}
