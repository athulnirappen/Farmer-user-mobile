import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { API_ORIGIN } from '@/api/client';
import type { Product } from '@/api/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  product: Product;
  style: { width: number; height: number; borderRadius?: number };
};

export function ProductImage({ product, style }: Props) {
  const colors = useTheme();
  const image = product.images[0];

  if (!image) {
    return (
      <View
        style={[
          style,
          { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundElement },
        ]}>
        <Ionicons name="leaf-outline" size={28} color={colors.textSecondary} />
      </View>
    );
  }

  // The API stores image URLs relative to its own origin
  return (
    <Image
      source={`${API_ORIGIN}${image.url}`}
      style={[style, { backgroundColor: colors.backgroundElement }]}
      contentFit="cover"
      transition={150}
    />
  );
}
