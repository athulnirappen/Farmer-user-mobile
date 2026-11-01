import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useCategories } from '@/api/categories';
import { ProductList } from '@/components/product-list';
import { Chip } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useDebounced } from '@/hooks/use-debounced';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';
import { getCurrentCoords } from '@/utils/location';

const NEARBY_RADIUS_KM = 50;

type Point = { lat: number; lng: number };

export default function BrowseScreen() {
  const colors = useTheme();
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
      <View style={styles.controls}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search vegetables, fruit, milk…"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          autoCorrect={false}
          style={[styles.search, { color: colors.text, backgroundColor: colors.backgroundElement }]}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}>
          <Chip label="Near me" selected={!!near} busy={locating} onPress={toggleNearMe} />
          <Chip
            label="All"
            selected={categoryId === undefined}
            onPress={() => setCategoryId(undefined)}
          />
          {categories.data?.items.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
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
  controls: { paddingTop: Spacing.three, gap: Spacing.two },
  search: {
    marginHorizontal: Spacing.three,
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  chips: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  locationError: { marginHorizontal: Spacing.three, fontSize: 14 },
});
