// Bloom primitives — the entire layer the agent composes from. Each one reads
// from useTokens() so a single edit to src/lib/tokens/active.ts re-themes the
// whole app. Keep this file the SINGLE source of primitives — adding parallel
// styled components elsewhere defeats the design system.
//
// Design choices worth defending:
// - One file. Splitting per-primitive triples the import graph for ~250 lines.
// - No StyleSheet.create with literal colors anywhere; every color is a token.
// - Press encodes motion.vibe as scale/opacity preset (snappy/playful → scale,
//   soft/still → opacity). The agent doesn't need to think about it.
// - Motion wraps Reanimated entering/exiting and pulls spring from tokens.
//   `preset` covers the 80% case; `entering`/`exiting` props are escape hatch.
import React from 'react';
import {
  Modal,
  Pressable,
  PressableProps,
  ScrollView,
  StyleProp,
  Text,
  TextProps,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { icons as LucideIcons } from 'lucide-react-native';
import { useTokens } from '../tokens';
import type { DesignTokens } from '../tokens';

// -- Surface --------------------------------------------------------------
// Screen container. Defaults to safe-area, background tone. Pass `tone="surface"`
// to use surface color (a panel inside a screen).
export function Surface({
  tone = 'background',
  style,
  children,
  scroll = false,
  ...rest
}: ViewProps & {
  tone?: 'background' | 'surface' | 'surfaceElevated';
  scroll?: boolean;
}) {
  const t = useTokens();
  const bg = t.palette[tone];
  const Container = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <Container
        style={[
          { flex: 1, backgroundColor: bg, paddingHorizontal: t.spacing.baseUnit * 2 },
          style as StyleProp<ViewStyle>,
        ]}
        {...(rest as object)}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}

// -- Stack ----------------------------------------------------------------
// Flex stack. `gap` is in spacing units (multiplied by tokens.spacing.baseUnit).
export function Stack({
  direction = 'col',
  gap = 0,
  align,
  justify,
  style,
  children,
  ...rest
}: ViewProps & {
  direction?: 'row' | 'col';
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
}) {
  const t = useTokens();
  return (
    <View
      style={[
        {
          flexDirection: direction === 'row' ? 'row' : 'column',
          gap: gap * t.spacing.baseUnit,
          alignItems: align,
          justifyContent: justify,
        },
        style as StyleProp<ViewStyle>,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

// -- Typography helpers ---------------------------------------------------

const HEAD_WEIGHT_BY_CHARACTER: Record<DesignTokens['typography']['character'], TextStyle['fontWeight']> = {
  geometric: '700',
  humanist: '600',
  serif: '400',
  'editorial-mix': '400',
  technical: '600',
};

const HEAD_LETTER_SPACING_BY_CHARACTER: Record<DesignTokens['typography']['character'], number> = {
  geometric: -0.4,
  humanist: 0,
  serif: 0,
  'editorial-mix': -0.2,
  technical: 0,
};

function headingSize(t: DesignTokens, level: 1 | 2 | 3): number {
  const base = 16;
  // level 1: base * scaleRatio^3, level 2: ^2, level 3: ^1
  return Math.round(base * Math.pow(t.typography.scaleRatio, 4 - level));
}

// -- Display --------------------------------------------------------------
export function Display({
  level = 1,
  style,
  children,
  ...rest
}: TextProps & { level?: 1 | 2 | 3 }) {
  const t = useTokens();
  const size = headingSize(t, level);
  return (
    <Text
      style={[
        {
          color: t.palette.text,
          fontFamily: t.typography.headingFamily,
          fontWeight: HEAD_WEIGHT_BY_CHARACTER[t.typography.character],
          fontSize: size,
          letterSpacing: HEAD_LETTER_SPACING_BY_CHARACTER[t.typography.character] * (size / 16),
          lineHeight: size * 1.15,
        },
        style as StyleProp<TextStyle>,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

// -- Body -----------------------------------------------------------------
export function Body({ style, children, ...rest }: TextProps) {
  const t = useTokens();
  const isSerif = t.typography.character === 'serif';
  return (
    <Text
      style={[
        {
          color: t.palette.text,
          fontFamily: t.typography.bodyFamily,
          fontSize: 15,
          fontWeight: '400',
          lineHeight: isSerif ? 24 : 22,
        },
        style as StyleProp<TextStyle>,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

// -- Caption --------------------------------------------------------------
export function Caption({ style, children, ...rest }: TextProps) {
  const t = useTokens();
  // Technical character uses mono for caption — IDs / timestamps / status
  // labels are the home for mono in a non-terminal product.
  const fontFamily = t.typography.character === 'technical' ? 'Geist Mono' : t.typography.bodyFamily;
  return (
    <Text
      style={[
        {
          color: t.palette.textMuted,
          fontFamily,
          fontSize: 12,
          fontWeight: '400',
          lineHeight: 16,
        },
        style as StyleProp<TextStyle>,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

// -- Press ----------------------------------------------------------------
// Tap target. Motion preset comes from tokens.motion.vibe — agent never picks.
// snappy/playful → scale; soft/still → opacity. springStiffness/Damping flow
// through.
export function Press({
  style,
  children,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle> }) {
  const t = useTokens();
  const usesScale = t.motion.vibe === 'snappy' || t.motion.vibe === 'playful';
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: usesScale ? [{ scale: scale.value }] : [],
    opacity: usesScale ? 1 : opacity.value,
  }));

  const onPressIn = () => {
    if (usesScale) {
      scale.value = withSpring(t.motion.vibe === 'playful' ? 0.94 : 0.97, {
        stiffness: t.motion.springStiffness,
        damping: t.motion.springDamping,
      });
    } else {
      opacity.value = withSpring(t.motion.vibe === 'soft' ? 0.85 : 0.65, {
        stiffness: t.motion.springStiffness,
        damping: t.motion.springDamping,
      });
    }
  };
  const onPressOut = () => {
    if (usesScale) {
      scale.value = withSpring(1, {
        stiffness: t.motion.springStiffness,
        damping: t.motion.springDamping,
      });
    } else {
      opacity.value = withSpring(1, {
        stiffness: t.motion.springStiffness,
        damping: t.motion.springDamping,
      });
    }
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} style={style} {...rest}>
        {children as React.ReactNode}
      </Pressable>
    </Animated.View>
  );
}

// -- Sheet ----------------------------------------------------------------
export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const t = useTokens();
  return (
    <Modal
      visible={open}
      transparent
      animationType={t.motion.vibe === 'still' ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{}}>
          <View
            style={{
              backgroundColor: t.palette.surfaceElevated,
              borderTopLeftRadius: t.radius.base * 1.5,
              borderTopRightRadius: t.radius.base * 1.5,
              padding: t.spacing.baseUnit * 3,
              minHeight: 200,
            }}
          >
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// -- Field ----------------------------------------------------------------
export function Field({
  style,
  placeholder,
  value,
  onChangeText,
  ...rest
}: TextInputProps) {
  const t = useTokens();
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={t.palette.textMuted}
      value={value}
      onChangeText={onChangeText}
      style={[
        {
          color: t.palette.text,
          fontFamily: t.typography.bodyFamily,
          fontSize: 15,
          paddingHorizontal: t.spacing.baseUnit * 1.5,
          paddingVertical: t.spacing.baseUnit * 1.25,
          backgroundColor: t.palette.surface,
          borderColor: t.palette.border,
          borderWidth: 1,
          borderRadius: radiusOf(t, t.radius.base),
        },
        style as StyleProp<TextStyle>,
      ]}
      {...rest}
    />
  );
}

// -- Icon -----------------------------------------------------------------
// Wraps lucide-react-native. `name` is the PascalCase icon name
// (e.g., "Sparkles", "ArrowRight"). Color defaults to text token.
export function Icon({
  name,
  size = 20,
  color,
  strokeWidth,
}: {
  name: keyof typeof LucideIcons;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const t = useTokens();
  const Cmp = LucideIcons[name];
  if (!Cmp) return null;
  const sw =
    strokeWidth ??
    (t.iconography.weight === 'thin' ? 1.25 : t.iconography.weight === 'bold' ? 2.25 : 1.75);
  return <Cmp size={size} color={color ?? t.palette.text} strokeWidth={sw} />;
}

// -- Motion ---------------------------------------------------------------
// Thin Reanimated wrapper. `preset` covers the common entrances; `entering`
// /`exiting` props pass through for the agent's escape hatch.
const PRESETS = {
  'fade': FadeIn,
  'fade-out': FadeOut,
  'slide-up': SlideInUp,
  'slide-down': SlideInDown,
  'slide-out-down': SlideOutDown,
  'zoom': ZoomIn,
} as const;

export function Motion({
  preset,
  delay = 0,
  duration,
  children,
  style,
}: {
  preset?: keyof typeof PRESETS;
  delay?: number;
  duration?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTokens();
  // "still" vibe wires NO entrance motion regardless of preset. The vibe IS
  // the design language; opting out by passing a preset would violate it.
  if (t.motion.vibe === 'still' || !preset) {
    return <Animated.View style={style}>{children}</Animated.View>;
  }
  const entering = PRESETS[preset]
    .duration(duration ?? (t.motion.vibe === 'soft' ? 450 : 280))
    .delay(delay);
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

// -- Pill -----------------------------------------------------------------
export function Pill({
  tone = 'neutral',
  children,
  style,
}: {
  tone?: 'neutral' | 'primary' | 'success' | 'warn' | 'error';
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTokens();
  const bg =
    tone === 'primary'
      ? t.palette.primary
      : tone === 'success'
      ? t.palette.semantic.success
      : tone === 'warn'
      ? t.palette.semantic.warn
      : tone === 'error'
      ? t.palette.semantic.error
      : t.palette.surface;
  const fg =
    tone === 'neutral'
      ? t.palette.text
      : tone === 'primary'
      ? t.palette.background
      : t.palette.text;
  return (
    <View
      style={[
        {
          paddingHorizontal: t.spacing.baseUnit * 1.25,
          paddingVertical: t.spacing.baseUnit * 0.5,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: tone === 'neutral' ? 1 : 0,
          borderColor: t.palette.border,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: fg,
          fontFamily: t.typography.bodyFamily,
          fontSize: 11,
          fontWeight: '500',
          letterSpacing: 0.3,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

// -- Divider --------------------------------------------------------------
export function Divider({
  axis = 'horizontal',
  style,
}: {
  axis?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTokens();
  return (
    <View
      style={[
        axis === 'horizontal'
          ? { height: 1, alignSelf: 'stretch', backgroundColor: t.palette.border }
          : { width: 1, alignSelf: 'stretch', backgroundColor: t.palette.border },
        style,
      ]}
    />
  );
}

// -- helpers --------------------------------------------------------------
function radiusOf(t: DesignTokens, base: number): number {
  if (t.radius.character === 'sharp') return 0;
  if (t.radius.character === 'pill') return 999;
  return base;
}
