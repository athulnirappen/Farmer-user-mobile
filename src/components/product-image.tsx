import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { type DimensionValue, StyleSheet, View } from 'react-native';

import { imageUrl } from '@/api/client';
import type { Product } from '@/api/types';
import type { IconName } from '@/components/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  product: Pick<Product, 'images' | 'category'>;
  style: { width: DimensionValue; height: number; borderRadius?: number };
};

const PLACEHOLDERS: [RegExp, IconName, string, string][] = [
  [/fruit/i, 'nutrition', '#FBE7D3', '#D9772B'],
  [/dairy|milk/i, 'water', '#DEEBF7', '#3E7CB1'],
  [/grain|rice|cereal/i, 'flower', '#F7EDC8', '#B08A1E'],
  [/green|leaf/i, 'leaf', '#DDF1D8', '#3F8F48'],
];
const DEFAULT_PLACEHOLDER: [IconName, string, string] = ['leaf', '#E2F0DC', '#2F7D3F'];

// A tinted tile for each category, so listings without photos still look distinct
const placeholderFor = (category: string) => {
  const match = PLACEHOLDERS.find(([pattern]) => pattern.test(category));
  return match ? (match.slice(1) as typeof DEFAULT_PLACEHOLDER) : DEFAULT_PLACEHOLDER;
};

export function ProductImage({ product, style }: Props) {
  const colors = useTheme();
  const dark = useColorScheme() === 'dark';
  const image = product.images[0];

  if (!image) {
    const [icon, tint, color] = placeholderFor(product.category.name);
    // The pale tints glare on a dark screen
    const backgroundColor = dark ? colors.backgroundElement : tint;
    return (
      <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor }]}>
        <View style={[styles.circle, { backgroundColor: colors.surface }]}>
          <Ionicons name={icon} size={Math.min(style.height / 3.4, 44)} color={color} />
        </View>
      </View>
    );
  }

  return (
    <Image
      source={imageUrl(image.url)}
      style={style}
      contentFit="cover"
      transition={150}
    />
  );
}

const styles = StyleSheet.create({
  circle: { padding: 14, borderRadius: 999 },
});
