import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Brand, Spacing } from '@/constants/theme';

import { BrandMark } from './brand-mark';

const DURATION = 450;
const SPLASH_BACKGROUND = '#07120D';
const SPLASH_TEXT = '#F2F7F4';
const SPLASH_MUTED = '#9BB0A6';
const SPLASH_BRAND = '#3DD68C';
const SPLASH_BRAND_TEXT = '#04140C';

const exitKeyframe = new Keyframe({
  0: {
    opacity: 1,
  },
  100: {
    opacity: 0,
    easing: Easing.in(Easing.ease),
  },
});

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const content = (
    <View style={styles.content}>
      <BrandMark size={72} backgroundColor={SPLASH_BRAND} color={SPLASH_BRAND_TEXT} />
      <Text style={styles.brand}>{Brand.name}</Text>
      <Text style={styles.tagline}>{Brand.tagline}</Text>
    </View>
  );

  if (!animate) {
    return (
      <View
        style={styles.overlay}
        onLayout={() => {
          SplashScreen.hideAsync().finally(() => setAnimate(true));
        }}>
        {content}
      </View>
    );
  }

  return (
    <Animated.View
      entering={exitKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.overlay}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  brand: {
    marginTop: Spacing.two,
    color: SPLASH_TEXT,
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  tagline: {
    color: SPLASH_MUTED,
    fontSize: 14,
    fontWeight: 500,
  },
});
