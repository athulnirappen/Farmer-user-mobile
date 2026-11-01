import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useCategories } from '@/api/categories';
import { API_ORIGIN } from '@/api/client';
import {
  type ProductChanges,
  useDeclaration,
  useDeleteProduct,
  useMyProducts,
  useProductImages,
  useSaveProduct,
} from '@/api/farmer';
import type { OwnedProduct } from '@/api/types';
import { Button, Chip, ErrorState, Field, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

const MAX_IMAGES = 5;

function Photos({ product }: { product: OwnedProduct }) {
  const colors = useTheme();
  const { add, remove } = useProductImages(product.id);
  const [pickError, setPickError] = useState<string>();
  const busy = add.isPending || remove.isPending;
  const error = pickError ?? (add.error || remove.error ? errorMessage(add.error ?? remove.error) : null);

  const pick = async (source: 'library' | 'camera') => {
    setPickError(undefined);
    // A lower quality keeps phone photos well under the API's 5 MB limit
    const options = { mediaTypes: ['images'], quality: 0.7 } satisfies ImagePicker.ImagePickerOptions;

    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        setPickError('Camera access is off. Allow it for this app in your phone settings.');
        return;
      }
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled) add.mutate(result.assets[0].uri);
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Photos ({product.images.length} of {MAX_IMAGES})
      </Text>
      <View style={styles.photos}>
        {product.images.map((image) => (
          <View key={image.id}>
            <Image source={`${API_ORIGIN}${image.url}`} style={styles.photo} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              disabled={busy}
              onPress={() => remove.mutate(image.id)}
              hitSlop={8}
              style={[styles.removePhoto, { backgroundColor: colors.background }]}>
              <Ionicons name="close" size={18} color={colors.danger} />
            </Pressable>
          </View>
        ))}
      </View>
      {error && <Text style={{ color: colors.danger }}>{error}</Text>}
      {product.images.length < MAX_IMAGES && (
        <View style={styles.photoButtons}>
          <Button
            label="Choose a photo"
            variant="plain"
            busy={add.isPending}
            disabled={busy}
            onPress={() => pick('library')}
          />
          <Button
            label="Take a photo"
            variant="plain"
            disabled={busy}
            onPress={() => pick('camera')}
          />
        </View>
      )}
    </View>
  );
}

function ProductForm({ product }: { product?: OwnedProduct }) {
  const colors = useTheme();
  const categories = useCategories();
  const declaration = useDeclaration();
  const save = useSaveProduct(product?.id);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? String(Number(product.price)) : '');
  const [unit, setUnit] = useState(product?.unit ?? '');
  const [stock, setStock] = useState(product ? String(product.stock) : '');
  const [categoryId, setCategoryId] = useState(product?.category.id);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [accepted, setAccepted] = useState(false);

  const details = {
    name: name.trim(),
    description: description.trim(),
    price: Number(price),
    unit: unit.trim(),
    ...(categoryId && { categoryId }),
  };
  const stockCount = Number(stock);

  // Only what changed is sent, because anything but stock or pausing needs the declaration
  const changedDetails = Object.fromEntries(
    Object.entries(details).filter(([key, value]) => {
      if (!product) return true;
      if (key === 'price') return value !== Number(product.price);
      if (key === 'categoryId') return value !== product.category.id;
      if (key === 'description') return value !== (product.description ?? '');
      return value !== product[key as 'name' | 'unit'];
    })
  );
  const describes = Object.keys(changedDetails).length > 0;
  const stockChanged = stockCount !== product?.stock;
  const pauseChanged = isActive !== (product?.isActive ?? true);

  const valid =
    details.name.length >= 2 &&
    details.price > 0 &&
    details.unit.length >= 1 &&
    categoryId !== undefined &&
    stock !== '' &&
    Number.isInteger(stockCount) &&
    stockCount >= 0;
  const ready =
    valid &&
    (describes || stockChanged || pauseChanged) &&
    (!describes || (accepted && declaration.data !== undefined));

  const submit = () => {
    const body: ProductChanges = {
      ...changedDetails,
      ...((!product || stockChanged) && { stock: stockCount }),
      ...(pauseChanged && { isActive }),
      ...(describes && {
        acceptDeclaration: accepted,
        declarationVersion: declaration.data?.version,
      }),
    };

    save.mutate(body, {
      onSuccess: (saved) => {
        setAccepted(false);
        // A new product can have photos now that it exists
        if (product) router.back();
        else router.replace({ pathname: '/farm-product-form', params: { id: saved.id } });
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: product ? 'Edit product' : 'New product' }} />
      <Field label="Name" value={name} onChangeText={setName} maxLength={120} />
      <Field
        label="Description (optional)"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={2000}
      />
      <View style={styles.row}>
        <View style={styles.rowField}>
          <Field label="Price in ₹" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        </View>
        <View style={styles.rowField}>
          <Field label="Sold per, e.g. kg" value={unit} onChangeText={setUnit} maxLength={20} />
        </View>
      </View>
      <Field label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
        {categories.isError && (
          <Button label="Try again" variant="plain" onPress={() => categories.refetch()} />
        )}
        <View style={styles.chips}>
          {categories.data?.items.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              selected={category.id === categoryId}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </View>
      </View>

      {product && (
        <View style={styles.switchRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Show to buyers</Text>
          <Switch
            accessibilityLabel="Show to buyers"
            value={isActive}
            onValueChange={setIsActive}
          />
        </View>
      )}

      {describes && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Declaration</Text>
          {declaration.isError ? (
            <Text style={{ color: colors.danger }}>{errorMessage(declaration.error)}</Text>
          ) : (
            <Text style={{ color: colors.textSecondary }}>{declaration.data?.text}</Text>
          )}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            onPress={() => setAccepted(!accepted)}
            style={styles.accept}>
            <Ionicons
              name={accepted ? 'checkbox' : 'square-outline'}
              size={24}
              color={accepted ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.acceptLabel, { color: colors.text }]}>
              I accept this declaration
            </Text>
          </Pressable>
        </View>
      )}

      {save.isError && <Text style={{ color: colors.danger }}>{errorMessage(save.error)}</Text>}
      <Button label="Save" busy={save.isPending} disabled={!ready} onPress={submit} />

      {product && <Photos product={product} />}
      {product && <DeleteProduct product={product} />}
    </ScrollView>
  );
}

function DeleteProduct({ product }: { product: OwnedProduct }) {
  const colors = useTheme();
  const remove = useDeleteProduct(product.id);

  const confirm = () =>
    Alert.alert(`Delete ${product.name}?`, 'Buyers will no longer see it. Past orders are kept.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(undefined, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <View>
      {remove.isError && <Text style={{ color: colors.danger }}>{errorMessage(remove.error)}</Text>}
      <Button label="Delete product" variant="plain" busy={remove.isPending} onPress={confirm} />
    </View>
  );
}

export default function FarmProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const products = useMyProducts();

  if (!id) return <ProductForm />;
  if (products.isPending) return <Loading />;
  if (products.isError) {
    return <ErrorState error={products.error} onRetry={() => products.refetch()} />;
  }

  const product = products.data.pages.flatMap((page) => page.items).find((item) => item.id === id);
  // Nothing to edit once a delete has refreshed the list and the screen is on its way out
  if (!product) return null;

  return <ProductForm key={product.id} product={product} />;
}

const styles = StyleSheet.create({
  form: { padding: Spacing.three, gap: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.three },
  rowField: { flex: 1 },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accept: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44 },
  acceptLabel: { flex: 1, fontSize: 16 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  photo: { width: 96, height: 96, borderRadius: 10 },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtons: { flexDirection: 'row', flexWrap: 'wrap' },
});
