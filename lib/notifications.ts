// Đặt thông báo nhắc việc ngay trên máy (local notification) — không cần server push.

import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { planReminders, signature } from './reminders';
import type { Task } from './types';

const CHANNEL = 'reminders';
/** Loại thông báo lời mời sự kiện (003): có 2 nút ngay trên thông báo. Trùng `categoryId` máy chủ gửi qua Expo Push. */
export const INVITE_CATEGORY = 'event_invite';
export const ACTION_GOING = 'going';
export const ACTION_DECLINE = 'decline';
let lastSignature = '';

export const supported = Platform.OS !== 'web';

/** Gọi một lần khi app khởi động: hiển thị thông báo cả khi app đang mở. */
export function configureNotifications() {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  // Mở app khi bấm nút để gọi máy chủ bằng phiên đang đăng nhập (không gọi mạng khi app đang đóng).
  Notifications.setNotificationCategoryAsync(INVITE_CATEGORY, [
    { identifier: ACTION_GOING, buttonTitle: 'Tham gia', options: { opensAppToForeground: true } },
    { identifier: ACTION_DECLINE, buttonTitle: 'Không', options: { opensAppToForeground: true, isDestructive: true } },
  ]).catch(() => {});
}

/** Bấm thông báo lời mời → trả lời nào? `null` = chỉ mở app (bấm vào thân thông báo). */
export function inviteAnswer(actionId: string): boolean | null {
  return actionId === ACTION_GOING ? true : actionId === ACTION_DECLINE ? false : null;
}

/** Xin quyền (Android 13+ cần có channel trước khi hỏi). Trả về true nếu được phép. */
export async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Nhắc việc',
      importance: AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return asked.granted;
}

/** Đồng bộ lịch nhắc với danh sách việc. Chỉ đặt lại khi kế hoạch thay đổi. Trả về số thông báo đã đặt. */
export async function syncReminders(tasks: Task[], now = new Date(), force = false): Promise<number> {
  if (!supported) return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return 0;
  const plan = planReminders(tasks, now);
  const sig = signature(plan);
  if (!force && sig === lastSignature) return plan.length;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of plan) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body, data: { taskId: r.taskId } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.date, channelId: CHANNEL },
    });
  }
  lastSignature = sig;
  return plan.length;
}

export async function clearReminders() {
  if (!supported) return;
  lastSignature = '';
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduledCount(): Promise<number> {
  if (!supported) return 0;
  return (await Notifications.getAllScheduledNotificationsAsync()).length;
}
