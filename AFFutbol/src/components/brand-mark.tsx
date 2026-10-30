import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type BrandMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  color?: string;
};

export function BrandMark({ size = 32, style, backgroundColor, color }: BrandMarkProps) {
  const theme = useTheme();

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.mark,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: backgroundColor ?? theme.brand,
        },
        style,
      ]}>
      <Text style={[styles.text, { color: color ?? theme.inverseText, fontSize: size * 0.4 }]}>
        AF
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 800,
    letterSpacing: 0.5,
  },
});
