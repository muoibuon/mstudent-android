import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown, LinearTransition, ReduceMotion, type ExitAnimationsValues, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

// MStudent UI Kit v1: ui-in, ui-cardout, ui-press and ui-tab.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const TAB_SPRING = { damping: 18, stiffness: 220, reduceMotion: ReduceMotion.System };

export const resizeContent = LinearTransition.duration(210).reduceMotion(ReduceMotion.System);

export function taskExit(values: ExitAnimationsValues) {
  'worklet';
  const timing = { duration: 280, easing: Easing.in(Easing.quad), reduceMotion: ReduceMotion.System };
  return {
    initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
    animations: { opacity: withTiming(0, timing), transform: [{ translateX: withTiming(-values.currentWidth * 1.15, timing) }] },
  };
}

export function MotionPressable({ onPressIn, onPressOut, style, ...props }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <AnimatedPressable
      {...props}
      style={[style, motion]}
      onPressIn={(event) => {
        if (!reduceMotion) scale.set(withTiming(0.94, { duration: 100 }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, TAB_SPRING));
        onPressOut?.(event);
      }}
    />
  );
}

export function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      style={style}
      entering={FadeInDown.duration(220)
        .delay(delay)
        .easing(Easing.bezier(0.2, 0.8, 0.2, 1))
        .withInitialValues({ transform: [{ translateY: 16 }] })
        .reduceMotion(ReduceMotion.System)}>
      {children}
    </Animated.View>
  );
}
