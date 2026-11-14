// Nhân vật theo UI Kit: "Meme" (phong thư vàng chanh) và nhân vật theo loại việc. Nét đen 2.5px, không emoji.

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Polygon, Rect } from 'react-native-svg';

import { BRAND, FONT, usePalette } from '@/constants/theme';
import type { Category } from '@/lib/types';

const INK = BRAND.ink;
const EASE = Easing.inOut(Easing.ease);
const DOT_EASE = Easing.inOut(Easing.ease);
type Mood = 'happy' | 'thinking' | 'sleeping' | 'worried' | 'celebrating' | 'offline';
const PERIOD = { happy: 2400, thinking: 0, sleeping: 3000, worried: 1600, celebrating: 1100, offline: 3000 };

export function useMotionPhase(duration: number, enabled: boolean, repeats = -1) {
  const phase = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    phase.set(0);
    if (!duration || !enabled || reduceMotion) return;
    phase.set(withRepeat(withTiming(1, { duration, easing: Easing.linear }), repeats));
    return () => cancelAnimation(phase);
  }, [duration, enabled, phase, reduceMotion, repeats]);
  return phase;
}

export function ThinkingDots({ color }: { color: string }) {
  const phase = useMotionPhase(1200, true);
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((i) => <ThinkingDot key={i} index={i} phase={phase} color={color} />)}
    </View>
  );
}

function ThinkingDot({ index, phase, color }: { index: number; phase: ReturnType<typeof useMotionPhase>; color: string }) {
  const animation = useAnimatedStyle(() => {
    const p = (phase.get() - index * 0.125 + 1) % 1;
    const lift = DOT_EASE(interpolate(p, [0, 0.3, 0.6, 1], [0, 1, 0, 0]));
    return { opacity: 0.35 + lift * 0.65, transform: [{ translateY: -4 * lift }] };
  });
  return <Animated.View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }, animation]} />;
}

export function HelloStar() {
  const phase = useMotionPhase(12000, true);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${phase.get() * 360}deg` }] }));
  return (
    <Animated.View style={spin}>
      <Svg width={90} height={90} viewBox="0 0 80 80">
        <Polygon points="40,4 48,14 60,9 63,22 76,25 70,37 77,49 65,54 63,67 50,66 40,76 31,66 17,68 16,55 4,49 10,37 4,25 17,22 20,9 32,14" fill={BRAND.lime} stroke={INK} strokeWidth={2} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: INK, fontFamily: FONT.bold, fontSize: 12, transform: [{ rotate: '9deg' }] }}>Xin chào!</Text>
      </View>
    </Animated.View>
  );
}

/** Nhịp chuyển động và biểu cảm từ Mascot.dc.html của MStudent UI Kit. */
export function Meme({ size = 120, wave = false, animate = false, mood = 'happy' }: { size?: number; wave?: boolean; animate?: boolean; mood?: Mood }) {
  const c = usePalette();
  const height = (size * 112) / 120;
  const phase = useMotionPhase(PERIOD[mood], animate, mood === 'celebrating' ? 2 : -1);
  const blinking = useMotionPhase(4000, animate && mood === 'happy');
  const asleep = mood === 'sleeping' || mood === 'offline';
  const bounce = useAnimatedStyle(() => {
    const progress = phase.get();
    const bob = EASE(progress <= 0.5 ? 2 * progress : 2 * (1 - progress));
    if (mood === 'worried') {
      return { transform: [{ rotate: `${interpolate(progress, [0, 0.55, 0.62, 0.70, 0.78, 0.86, 1], [0, 0, -5, 5, -3, 2, 0])}deg` }] };
    }
    if (mood === 'celebrating') {
      const jump = Easing.bezier(0.3, 0.7, 0.4, 1).factory()(progress);
      return { transform: [
        { translateY: interpolate(jump, [0, 0.15, 0.45, 0.75, 1], [0, 0, -18, 0, 0]) },
        { scaleX: interpolate(jump, [0, 0.15, 0.45, 0.75, 1], [1, 1.08, 0.95, 1.06, 1]) },
        { scaleY: interpolate(jump, [0, 0.15, 0.45, 0.75, 1], [1, 0.9, 1.06, 0.94, 1]) },
      ] };
    }
    return { transform: [{ translateY: asleep ? 3 * bob : -6 * bob }, { rotate: `${asleep ? -2 * bob : 0}deg` }] };
  });
  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(phase.get(), [0, 0.6, 0.7, 0.8, 0.9, 1], [0, 0, -14, 8, -10, 0])}deg` }],
  }));
  const eyes = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(blinking.get(), [0, 0.88, 0.92, 1], [1, 1, 0.1, 1]) }],
  }));
  const drop = useAnimatedStyle(() => ({
    opacity: interpolate(phase.get(), [0, 0.3, 0.45, 1], mood === 'offline' ? [0, 0, 1, 0] : [1, 1, 1, 0]),
    transform: [{ translateY: interpolate(phase.get(), [0, 0.4, 1], [0, 0, 14]) }],
  }));
  return (
    <View pointerEvents="none" style={{ width: size, height }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 92%' }, bounce]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '81.67% 44.64%' }, wave && waveStyle]}>
        <Svg width={size} height={height} viewBox="0 0 120 112">
          <Path d={asleep ? 'M98 62 Q106 72 104 82' : mood === 'thinking' ? 'M98 58 Q112 70 88 82' : wave || mood === 'celebrating' ? 'M98 50 Q112 40 110 26' : 'M98 56 Q110 50 112 40'} fill="none" stroke={c.limbs} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={asleep ? 104 : mood === 'thinking' ? 88 : wave || mood === 'celebrating' ? 110 : 112} cy={asleep || mood === 'thinking' ? 82 : wave || mood === 'celebrating' ? 26 : 40} r={4} fill={c.limbs} />
        </Svg>
      </Animated.View>
      <View pointerEvents="none">
        <Svg width={size} height={height} viewBox="0 0 120 112">
          <Path d={asleep ? 'M22 62 Q14 72 16 82' : mood === 'celebrating' ? 'M22 50 Q10 40 8 26' : 'M22 56 Q10 58 6 68'} fill="none" stroke={c.limbs} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={asleep ? 16 : mood === 'celebrating' ? 8 : 6} cy={asleep ? 82 : mood === 'celebrating' ? 26 : 68} r={4} fill={c.limbs} />
          <Path d="M46 84 L42 100 M74 84 L78 100" stroke={c.limbs} strokeWidth={3} strokeLinecap="round" />
          <Ellipse cx={40} cy={102} rx={6} ry={3.5} fill={c.limbs} />
          <Ellipse cx={80} cy={102} rx={6} ry={3.5} fill={c.limbs} />
          <Rect x={20} y={24} width={80} height={62} rx={12} fill={BRAND.lime} />
          <Path d="M24 30 L60 56 L96 30" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          {asleep && <Path d={mood === 'offline' ? 'M43 68 Q49 63 55 68 M65 68 Q71 63 77 68' : 'M43 66 Q49 71 55 66 M65 66 Q71 71 77 66'} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />}
          {mood === 'celebrating' && (
            <>
              <Path d="M44 68 L49 63 L54 68 M66 68 L71 63 L76 68" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
              <Circle cx={40} cy={74} r={3.4} fill={BRAND.pink} />
              <Circle cx={80} cy={74} r={3.4} fill={BRAND.pink} />
            </>
          )}
          {mood === 'worried' && <Path d="M42 58 L53 61 M78 58 L67 61" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />}
          {mood === 'thinking' ? <Circle cx={60} cy={77} r={2.6} stroke={INK} strokeWidth={2.6} fill="none" /> :
            <Path d={mood === 'offline' ? 'M54 79 Q60 73 66 79' : mood === 'worried' ? 'M51 78 Q55.5 74 60 78 Q64.5 82 69 78' : mood === 'celebrating' ? 'M51 72 Q60 86 69 72 Z' : 'M54 73 Q60 79 66 73'} fill={mood === 'celebrating' ? INK : 'none'} stroke={INK} strokeWidth={3} strokeLinecap="round" />}
        </Svg>
      </View>
      {!asleep && mood !== 'celebrating' && (
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: '50% 59.82%' }, eyes]}>
          <Svg width={size} height={height} viewBox="0 0 120 112">
            <Circle cx={49} cy={67} r={3.4} fill={INK} />
            <Circle cx={71} cy={67} r={3.4} fill={INK} />
          </Svg>
        </Animated.View>
      )}
      {(mood === 'worried' || mood === 'offline') && (
        <Animated.View style={[StyleSheet.absoluteFill, drop]}>
          <Svg width={size} height={height} viewBox="0 0 120 112">
            <Path d={mood === 'worried' ? 'M100 30 Q105 39 100 43 Q95 39 100 30 Z' : 'M44 72 Q47 77 44 80 Q41 77 44 72 Z'} fill={mood === 'worried' ? '#FFFFFF' : BRAND.periwinkle} />
          </Svg>
        </Animated.View>
      )}
      </Animated.View>
      {mood === 'sleeping' && <MascotParticles sleep animate={animate} />}
      {mood === 'celebrating' && <MascotParticles animate={animate} />}
    </View>
  );
}

function MascotParticles({ sleep = false, animate }: { sleep?: boolean; animate: boolean }) {
  const phase = useMotionPhase(sleep ? 2400 : 1100, animate, sleep ? -1 : 2);
  return [0, 1, 2].map((index) => <Particle key={index} index={index} phase={phase} sleep={sleep} />);
}

function Particle({ index, phase, sleep }: { index: number; phase: ReturnType<typeof useMotionPhase>; sleep: boolean }) {
  const style = useAnimatedStyle(() => {
    const elapsed = phase.get();
    const lag = index * (sleep ? 1 / 3 : 0.11);
    const progress = sleep ? (elapsed + index / 3) % 1 : Math.max(0, (elapsed - lag) / (1 - lag));
    return {
      opacity: interpolate(progress, [0, 0.3, 1], [0, 1, 0]),
      transform: [{ translateY: -progress * (sleep ? 28 : 24) }, { translateX: sleep ? 14 * progress : 0 }, { scale: 0.5 + progress * 0.65 }],
    };
  });
  return (
    <Animated.View style={[{
      position: 'absolute', top: '25%', left: sleep ? '78%' : `${24 + index * 25}%`,
      width: 8, height: 8, borderRadius: index === 1 ? 4 : 2,
      backgroundColor: sleep ? 'transparent' : [BRAND.pink, BRAND.mint, BRAND.periwinkle][index],
    }, style]}>
      {sleep && <Text style={{ fontWeight: '800', color: BRAND.ink }}>z</Text>}
    </Animated.View>
  );
}

/** Mặt Meme thu nhỏ trong vòng tròn (ảnh đại diện của trợ lý trong chat). */
export function MemeAvatar({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={16} cy={16} r={16} fill={BRAND.lime} />
      <Path d="M7 10 L16 17 L25 10" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12.5} cy={21} r={1.4} fill={INK} />
      <Circle cx={19.5} cy={21} r={1.4} fill={INK} />
    </Svg>
  );
}

/** Nhân vật theo loại việc, ló ra ở góc dưới thẻ. `cardBg` để đổi màu khi trùng nền thẻ. */
export function CategoryCharacter({ category, cardBg, size = 80 }: { category: Category; cardBg?: string; size?: number }) {
  const h = (size * 72) / 80;
  const eyes = (y: number) => (
    <>
      <Circle cx={33} cy={y} r={2.6} fill={INK} />
      <Circle cx={47} cy={y} r={2.6} fill={INK} />
    </>
  );
  let body;
  switch (category) {
    case 'deadline':
      body = (
        <>
          <Rect x={10} y={12} width={60} height={48} rx={10} fill={cardBg === BRAND.lime ? BRAND.pinkDeep : cardBg === BRAND.pink ? BRAND.pinkDeep : BRAND.lime} />
          <Path d="M13 17 L40 37 L67 17" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {eyes(46)}
          <Path d="M36 51 Q40 55 44 51" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
      break;
    case 'exam':
      body = (
        <>
          <Path d="M8 60 A32 32 0 0 1 72 60 Z" fill={BRAND.pinkDeep} />
          <Path d="M29 44 Q32 41 35 44 M45 44 Q48 41 51 44" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M36 51 Q40 54 44 51" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
      break;
    case 'class_change':
      body = (
        <>
          <Polygon points="40,8 68,24 68,52 40,68 12,52 12,24" fill={cardBg === BRAND.periwinkle ? BRAND.mint : BRAND.periwinkle} />
          <Path d="M30 38 Q33 41 36 38 M44 38 Q47 41 50 38" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M36 46 Q40 50 44 46" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
      break;
    case 'event':
      body = (
        <>
          <Circle cx={40} cy={38} r={28} fill={BRAND.mint} />
          {eyes(34)}
          <Path d="M33 43 Q40 50 47 43" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
      break;
    case 'admin':
      body = (
        <>
          <Polygon
            points="40,4 47,22 66,14 58,32 76,40 58,46 66,64 47,56 40,72 33,56 14,64 22,46 4,40 22,32 14,14 33,22"
            fill={cardBg === BRAND.lime ? BRAND.mint : BRAND.lime}
          />
          <Circle cx={34} cy={38} r={2.4} fill={INK} />
          <Circle cx={46} cy={38} r={2.4} fill={INK} />
          <Path d="M37 45 Q40 47 43 45" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
        </>
      );
      break;
    default:
      body = (
        <>
          <Rect x={14} y={14} width={52} height={52} rx={26} fill={BRAND.cloud} />
          <Circle cx={33} cy={38} r={2.4} fill={INK} />
          <Circle cx={47} cy={38} r={2.4} fill={INK} />
          <Path d="M35 47 L45 47" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        </>
      );
  }
  return (
    <Svg width={size} height={h} viewBox="0 0 80 72" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {body}
    </Svg>
  );
}
