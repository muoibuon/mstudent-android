import assert from 'node:assert/strict';
import test from 'node:test';

import { ASSISTANT_COMMANDS, runAssistantCommand } from '../assistantCommands';
import type { Task } from '../types';

function task(id: number, title: string, due_at: Task['due_at'], category: Task['category'] = 'deadline'): Task {
  return {
    id, title, due_at, category, status: 'open', course: '', action: null, location: null,
    source: 'manual', sources: ['manual'], note: null, priority: 'medium', message_id: 'fixture', reminders: [], updated_from: [],
  };
}

test('assistant buttons use Vietnam dates, include due work from earlier today and sort upcoming exams', async () => {
  const now = new Date('2026-11-14T08:00:00+07:00');
  const api = {
    tasks: async () => [
      task(1, 'Thi ngoài tuần', '2026-11-21T08:00:00+07:00', 'exam'),
      task(2, 'Nộp báo cáo', '2026-11-14T18:00:00+07:00'),
      task(3, 'Việc sáng nay', '2026-11-13T23:00:00Z'),
      task(4, 'Thi giữa kỳ', '2026-11-17T08:00:00+07:00', 'exam'),
      task(5, 'Thi đã qua', '2026-11-13T23:59:00+07:00', 'exam'),
      task(6, 'Việc không có hạn', null),
    ],
    digest: async () => { throw new Error('Unexpected digest call'); },
  };
  const [today, week, exams] = await Promise.all(
    ASSISTANT_COMMANDS.slice(0, 3).map((command) => runAssistantCommand(command, api, now)),
  );
  assert.match(today.text, /2 việc đến hạn\n• Việc sáng nay .*Quá hạn\n• Nộp báo cáo/);
  assert.match(week.text, /3 việc đến hạn/);
  assert.doesNotMatch(week.text, /Thi ngoài tuần|Thi đã qua|không có hạn/);
  assert.match(exams.text, /2 lịch thi sắp tới\n• Thi giữa kỳ .*\n• Thi ngoài tuần/);
});

test('digest calls the digest endpoint and preserves the offline mode', async () => {
  const api = {
    tasks: async () => { throw new Error('Unexpected tasks call'); },
    digest: async () => ({ text: 'Nộp báo cáo hôm nay', mode: 'offline' }),
  };
  assert.deepEqual(await runAssistantCommand(ASSISTANT_COMMANDS[3], api, new Date()), {
    text: 'Nộp báo cáo hôm nay',
    mode: 'offline',
  });
});
