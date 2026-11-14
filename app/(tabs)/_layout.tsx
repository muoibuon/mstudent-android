// Thanh tab nổi theo UI Kit: thẻ trắng bo 34, bóng 0 8 24; mục đang chọn là vòng tròn đen, icon vàng chanh
// (chế độ tối: vòng vàng chanh, icon mực). Mỗi màn tự vẽ tiêu đề của mình nên tắt header mặc định.

import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon, type IconName } from '@/components/Icon';
import { MotionPressable, TAB_SPRING } from '@/components/Motion';
import { usePalette } from '@/constants/theme';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Trợ lý', icon: 'chat' },
  tasks: { label: 'Việc', icon: 'tasks' },
  calendar: { label: 'Lịch', icon: 'calendar' },
  settings: { label: 'Cài đặt', icon: 'settings' },
};

function FloatingTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [settled, setSettled] = useState(state.index);
  const track = useSharedValue(state.index);
  const cell = width / state.routes.length;
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: cell * (track.get() + 0.5) - 26 }] }));

  useEffect(() => {
    track.set(withSpring(state.index, TAB_SPRING, (finished) => {
      if (finished) scheduleOnRN(setSettled, state.index);
    }));
  }, [state.index, track]);

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{
        position: 'absolute',
        left: 24,
        right: 24,
        bottom: Math.max(insets.bottom, 12) + 8,
        height: 68,
        borderRadius: 34,
        backgroundColor: c.surface,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#141414',
        shadowOpacity: c.bg === '#FFFFFF' ? 0.12 : 0.5,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}>
      {width > 0 && (
        <Animated.View pointerEvents="none" style={[{
          position: 'absolute', left: 0, top: 8, width: 52, height: 52, borderRadius: 26, backgroundColor: c.active,
        }, slide]} />
      )}
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        return (
          <MotionPressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
            style={{
              flex: 1,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name={tab.icon} color={settled === i ? c.onActive : c.muted} />
          </MotionPressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Trợ lý' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Việc' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Lịch' }} />
      <Tabs.Screen name="settings" options={{ title: 'Cài đặt' }} />
    </Tabs>
  );
}
