import { dayDiff, fmtDue } from './dates';
import type { Task } from './types';

export const ASSISTANT_COMMANDS = [
  { id: 'today', label: 'Hôm nay cần làm gì?' },
  { id: 'week', label: 'Tuần này có gì?' },
  { id: 'exams', label: 'Lịch thi sắp tới' },
  { id: 'digest', label: 'Bản tin' },
] as const;

export type AssistantCommand = (typeof ASSISTANT_COMMANDS)[number];

interface CommandApi {
  tasks(): Promise<Task[]>;
  digest(): Promise<{ mode: string; text: string }>;
}

function includesTask(command: Exclude<AssistantCommand['id'], 'digest'>, task: Task, due: string, deadline: number, now: Date) {
  switch (command) {
    case 'today':
      return dayDiff(now, due) === 0;
    case 'week': {
      const days = dayDiff(now, due);
      return days >= 0 && days < 7;
    }
    case 'exams':
      return task.category === 'exam' && deadline >= now.getTime();
  }
}

const EMPTY_RESULT = {
  today: 'Hôm nay không có việc nào đến hạn.',
  week: 'Không có việc nào đến hạn trong 7 ngày tới.',
  exams: 'Chưa có lịch thi sắp tới.',
};

export async function runAssistantCommand(
  command: AssistantCommand,
  api: CommandApi,
  now: Date,
): Promise<{ text: string; mode?: string }> {
  if (command.id === 'digest') {
    const digest = await api.digest();
    return { text: digest.text, mode: digest.mode };
  }

  const { id } = command;
  const tasks = (await api.tasks())
    .flatMap((task) => {
      if (!task.due_at) return [];
      const deadline = Date.parse(task.due_at);
      if (!Number.isFinite(deadline)) return [];
      if (!includesTask(id, task, task.due_at, deadline, now)) return [];
      return [{ task, deadline }];
    })
    .sort((a, b) => a.deadline - b.deadline);

  if (tasks.length === 0) {
    return { text: EMPTY_RESULT[id] };
  }
  const limit = 10;
  const count = id === 'exams' ? `${tasks.length} lịch thi sắp tới` : `${tasks.length} việc đến hạn`;
  const lines = tasks.slice(0, limit).map(({ task, deadline }) => {
    const overdue = deadline < now.getTime() ? ' · Quá hạn' : '';
    return `• ${task.title} · ${fmtDue(task.due_at)}${overdue}`;
  });
  if (tasks.length > limit) lines.push(`Còn ${tasks.length - limit} mục. Xem thêm ở tab Việc.`);
  return { text: [count, ...lines].join('\n') };
}
