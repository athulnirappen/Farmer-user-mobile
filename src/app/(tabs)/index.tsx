import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useAddresses } from '@/api/addresses';
import { useCategories } from '@/api/categories';
import { useSession } from '@/auth/session';
import { ProductList } from '@/components/product-list';
import { Text } from '@/components/text';
import { Chip, Eyebrow, type IconName } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useDebounced } from '@/hooks/use-debounced';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';
import { getCurrentCoords } from '@/utils/location';

const NEARBY_RADIUS_KM = 50;

const CATEGORY_ICONS: [RegExp, IconName][] = [
  [/fruit/i, 'nutrition-outline'],
  [/dairy|milk/i, 'water-outline'],
  [/grain|rice|cereal/i, 'flower-outline'],
  [/veg|green|leaf/i, 'leaf-outline'],
];

const categoryIcon = (name: string) => CATEGORY_ICONS.find(([pattern]) => pattern.test(name))?.[1];

type Point = { lat: number; lng: number };

function DeliveringTo() {
  const colors = useTheme();
  const addresses = useAddresses();
  const address = addresses.data?.find(({ isDefault }) => isDefault);

  if (!address) return null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/addresses')}
      style={[styles.delivering, { backgroundColor: colors.primarySoft }]}>
      <Ionicons name="location-outline" size={17} color={colors.accent} />
      <Text style={[styles.deliveringLabel, { color: colors.text }]} numberOfLines={1}>
        Delivering to {address.label ? `${address.label}, ` : ''}
        {address.city}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function BrowseScreen() {
  const colors = useTheme();
  const { signedIn } = useSession();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>();
  const [near, setNear] = useState<Point>();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string>();
  const debouncedSearch = useDebounced(search.trim());

  const categories = useCategories();

  const toggleNearMe = async () => {
    if (locating) return;
    setLocationError(undefined);
    if (near) {
      setNear(undefined);
      return;
    }

    setLocating(true);
    try {
      const { latitude, longitude } = await getCurrentCoords();
      setNear({ lat: latitude, lng: longitude });
    } catch (error) {
      setLocationError(errorMessage(error));
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.heroStart, colors.heroEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}>
        <View style={styles.heroTag}>
          <Ionicons name="leaf-outline" size={14} color={colors.onHeroMuted} />
          <Eyebrow label="Direct from farmers" color={colors.onHeroMuted} />
        </View>
        <Text style={[styles.title, { color: colors.onHero }]}>Fresh from local farms</Text>
        <Text style={[styles.subtitle, { color: colors.accentBright }]}>
          Order today, get it tomorrow
        </Text>
        <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={21} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search vegetables, fruit, milk…"
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCorrect={false}
            style={[styles.search, { color: colors.text }]}
          />
        </View>
      </LinearGradient>
      <View style={styles.controls}>
        {signedIn && <DeliveringTo />}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}>
          <Chip
            label="Near me"
            icon="compass-outline"
            selected={!!near}
            busy={locating}
            onPress={toggleNearMe}
          />
          <Chip
            label="All"
            icon="checkmark-circle-outline"
            selected={categoryId === undefined}
            onPress={() => setCategoryId(undefined)}
          />
          {categories.data?.items.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              icon={categoryIcon(category.name)}
              selected={category.id === categoryId}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </ScrollView>
        {locationError && (
          <Text style={[styles.locationError, { color: colors.danger }]}>{locationError}</Text>
        )}
      </View>
      <ProductList
        filter={{
          search: debouncedSearch,
          categoryId,
          ...near,
          ...(near && { radiusKm: NEARBY_RADIUS_KM }),
        }}
        emptyMessage={
          near ? `Nothing found within ${NEARBY_RADIUS_KM} km of you.` : 'No products found.'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingTop: Spacing.three,
    paddingBottom: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    gap: Spacing.one,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: Spacing.one,
    borderRadius: Radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  title: { fontSize: 31, lineHeight: 38, fontFamily: Fonts.display },
  subtitle: { fontSize: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 54,
    marginTop: 12,
    paddingHorizontal: 18,
    borderRadius: Radius.medium,
  },
  search: { flex: 1, fontSize: 16, fontFamily: Fonts.body },
  controls: { paddingTop: Spacing.three, gap: 12 },
  delivering: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    maxWidth: '90%',
    minHeight: 38,
    marginHorizontal: Spacing.three,
    paddingHorizontal: 14,
    borderRadius: Radius.round,
  },
  deliveringLabel: { flexShrink: 1, fontSize: 14, fontFamily: Fonts.medium },
  chips: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  locationError: { marginHorizontal: Spacing.three, fontSize: 14 },
});
