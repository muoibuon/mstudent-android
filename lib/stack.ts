import type { Task } from './types';

/**
 * Thẻ việc có xếp chồng lên thẻ phía trên (-24px) không: chỉ khi hai thẻ khác màu (khác mức ưu tiên).
 * Hai thẻ cùng màu chồng lên nhau trông như một khối, nên để cách nhau.
 */
export function stackOverlap(prev: Pick<Task, 'priority'> | null | undefined, cur: Pick<Task, 'priority'>): boolean {
  return !!prev && prev.priority !== cur.priority;
}
