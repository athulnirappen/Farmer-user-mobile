import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { useCategories } from '@/api/categories';
import { API_ORIGIN } from '@/api/client';
import {
  type ProductChanges,
  useDeclaration,
  useDeleteProduct,
  useMyProducts,
  useProductImages,
  useSaveProduct,
  useUploadProductImages,
} from '@/api/farmer';
import type { OwnedProduct } from '@/api/types';
import { Text } from '@/components/text';
import { Button, Card, Chip, ErrorState, Eyebrow, Field, Loading, Pill } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

const MAX_IMAGES = 5;

// Opened from a link there's no screen behind this one to return to
const leave = () => (router.canGoBack() ? router.back() : router.replace('/farm-products'));

type PhotosProps = {
  product?: OwnedProduct;
  pending: string[];
  onPendingChange: (uris: string[]) => void;
  disabled: boolean;
};

function SavedPhoto({ productId, image, cover, disabled }: {
  productId: string;
  image: OwnedProduct['images'][number];
  cover: boolean;
  disabled: boolean;
}) {
  const { remove } = useProductImages(productId);

  return (
    <PhotoTile
      source={`${API_ORIGIN}${image.url}`}
      cover={cover}
      disabled={disabled || remove.isPending}
      error={remove.error}
      onRemove={() => remove.mutate(image.id)}
    />
  );
}

type PhotoTileProps = {
  source: string;
  cover: boolean;
  disabled: boolean;
  error?: unknown;
  onRemove: () => void;
};

function PhotoTile({ source, cover, disabled, error, onRemove }: PhotoTileProps) {
  const colors = useTheme();

  return (
    <View style={styles.photoTile}>
      <Image source={source} style={styles.photo} contentFit="cover" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Remove photo"
        disabled={disabled}
        onPress={onRemove}
        hitSlop={8}
        style={[styles.removePhoto, { backgroundColor: colors.surface }]}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </Pressable>
      {cover && (
        <View style={[styles.cover, { backgroundColor: colors.surface }]}>
          <Text style={[styles.coverLabel, { color: colors.text }]}>Cover</Text>
        </View>
      )}
      {!!error && <Text style={{ color: colors.danger }}>{errorMessage(error)}</Text>}
    </View>
  );
}

function Photos({ product, pending, onPendingChange, disabled }: PhotosProps) {
  const colors = useTheme();
  const [pickError, setPickError] = useState<string>();
  const saved = product?.images ?? [];
  const count = saved.length + pending.length;

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
    if (!result.canceled) onPendingChange([...pending, result.assets[0].uri]);
  };

  return (
    <View style={styles.section}>
      <View style={styles.photosHead}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Photos (optional)</Text>
        <Pill label={`${count} of ${MAX_IMAGES}`} tone="success" />
      </View>
      {count > 0 && (
        <View style={styles.photos}>
          {product &&
            saved.map((image, index) => (
              <SavedPhoto
                key={image.id}
                productId={product.id}
                image={image}
                cover={index === 0}
                disabled={disabled}
              />
            ))}
          {pending.map((uri, index) => (
            <PhotoTile
              key={uri}
              source={uri}
              cover={saved.length === 0 && index === 0}
              disabled={disabled}
              onRemove={() => onPendingChange(pending.filter((other) => other !== uri))}
            />
          ))}
        </View>
      )}
      {pickError && <Text style={{ color: colors.danger }}>{pickError}</Text>}
      {count < MAX_IMAGES && (
        <View style={styles.photoButtons}>
          <View style={styles.choosePhoto}>
            <Button
              label="Choose a photo"
              icon="images-outline"
              variant="soft"
              disabled={disabled}
              onPress={() => pick('library')}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take a photo"
            disabled={disabled}
            onPress={() => pick('camera')}
            style={[styles.camera, { backgroundColor: colors.primarySoft }, disabled && styles.dim]}>
            <Ionicons name="camera-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const UNITS = ['kg', 'litre', 'dozen', 'bunch'];

function StockField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const colors = useTheme();
  const count = Number(value) || 0;
  const step = (label: string, icon: 'remove' | 'add', next: number) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={next < 0}
      hitSlop={4}
      onPress={() => onChange(String(next))}
      style={[styles.stockStep, next < 0 && styles.dim]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </Pressable>
  );

  return (
    <View style={styles.rowField}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Stock</Text>
      <View style={[styles.stock, { backgroundColor: colors.primarySoft }]}>
        {step('Decrease stock', 'remove', count - 1)}
        <TextInput
          accessibilityLabel="Stock"
          value={value}
          onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
          keyboardType="number-pad"
          style={[styles.stockInput, { color: colors.text }]}
        />
        {step('Increase stock', 'add', count + 1)}
      </View>
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
  const [customUnit, setCustomUnit] = useState(!!product && !UNITS.includes(product.unit));
  const [categoryId, setCategoryId] = useState(product?.category.id);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [accepted, setAccepted] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  const upload = useUploadProductImages();
  const saving = save.isPending || upload.isPending;

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
  const fieldsChanged = describes || stockChanged || pauseChanged;
  const changed = fieldsChanged || pendingPhotos.length > 0;
  const ready = valid && changed && (!describes || (accepted && declaration.data !== undefined));
  const finished = !!product && !changed;

  const finish = (productId: string) => {
    if (pendingPhotos.length === 0) {
      leave();
      return;
    }

    upload.mutate(
      { productId, uris: pendingPhotos },
      {
        onSuccess: leave,
        onError: (error) => {
          setPendingPhotos([]);
          Alert.alert('A photo was not added', `The product is saved. ${errorMessage(error)}`);
          if (!product) router.replace({ pathname: '/farm-product-form', params: { id: productId } });
        },
      }
    );
  };

  const submit = () => {
    if (product && !fieldsChanged) {
      finish(product.id);
      return;
    }

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
        finish(saved.id);
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: product ? 'Edit product' : 'New product' }} />

      {product && (
        <Card style={styles.switchCard}>
          <View style={styles.switchText}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Show to buyers</Text>
            <Text style={{ color: colors.textSecondary }}>
              {isActive ? 'Buyers can see and order this' : 'Paused, so buyers can\'t see it'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Show to buyers"
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.onHero}
          />
        </Card>
      )}

      <Card style={styles.card}>
        <Field label="Product name" value={name} onChangeText={setName} maxLength={120} />

        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
          {categories.isError && (
            <Button label="Try again" variant="plain" onPress={() => categories.refetch()} />
          )}
          <View style={styles.chips}>
            {categories.data?.items.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                icon={category.id === categoryId ? 'checkmark' : undefined}
                selected={category.id === categoryId}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Sold per</Text>
          <View style={styles.units}>
            {UNITS.map((option) => {
              const selected = !customUnit && unit === option;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setCustomUnit(false);
                    setUnit(option);
                  }}
                  style={[
                    styles.unit,
                    { backgroundColor: selected ? colors.primary : colors.primarySoft },
                  ]}>
                  <Text style={[styles.unitLabel, { color: selected ? colors.onPrimary : colors.text }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              setCustomUnit(!customUnit);
              setUnit('');
            }}>
            <Text style={[styles.otherUnit, { color: colors.accent }]}>
              {customUnit ? 'Choose from the list' : 'Use another unit'}
            </Text>
          </Pressable>
          {customUnit && (
            <Field label="Unit" value={unit} onChangeText={setUnit} maxLength={20} placeholder="e.g. packet" />
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.rowField}>
            <Field
              label={unit ? `Price in ₹ per ${unit}` : 'Price in ₹'}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
          <StockField value={stock} onChange={setStock} />
        </View>

        <Field
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={2000}
        />

        <Photos
          product={product}
          pending={pendingPhotos}
          onPendingChange={setPendingPhotos}
          disabled={saving}
        />
      </Card>

      {describes && (
        <View style={[styles.declaration, { backgroundColor: colors.warningSoft }]}>
          <Eyebrow label="Seller declaration" color={colors.warning} />
          {declaration.isError ? (
            <Text style={{ color: colors.danger }}>{errorMessage(declaration.error)}</Text>
          ) : (
            <View style={[styles.declarationText, { backgroundColor: colors.surface }]}>
              <Text style={{ color: colors.text }}>{declaration.data?.text}</Text>
            </View>
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
      {describes && !accepted && (
        <Text style={[styles.acceptHint, { color: colors.warning }]}>
          Accept the declaration above to save.
        </Text>
      )}
      {finished ? (
        <Button label="Done" icon="checkmark" onPress={leave} />
      ) : (
        <Button
          label="Save product"
          icon="save-outline"
          busy={saving}
          disabled={!ready}
          onPress={submit}
        />
      )}

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
      <Button
        label="Delete product"
        icon="trash-outline"
        variant="danger"
        busy={remove.isPending}
        onPress={confirm}
      />
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
  form: { padding: Spacing.three, gap: 14 },
  card: { padding: Spacing.three, gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  rowField: { flex: 1, gap: Spacing.two },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 20, fontFamily: Fonts.display },
  fieldLabel: { fontSize: 14, fontFamily: Fonts.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  units: { flexDirection: 'row', gap: Spacing.two },
  unit: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitLabel: { fontSize: 14, fontFamily: Fonts.medium },
  otherUnit: { fontSize: 14, fontFamily: Fonts.semibold },
  stock: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: Radius.medium,
  },
  stockStep: { width: 40, height: 52, alignItems: 'center', justifyContent: 'center' },
  stockInput: { flex: 1, padding: 0, fontSize: 16, fontFamily: Fonts.semibold, textAlign: 'center' },
  dim: { opacity: 0.45 },
  switchCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.three },
  switchText: { flex: 1 },
  declaration: { padding: Spacing.three, gap: 12, borderRadius: Radius.large },
  declarationText: { padding: 14, borderRadius: Radius.small },
  accept: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  acceptLabel: { flex: 1, fontSize: 16 },
  acceptHint: { textAlign: 'center' },
  photosHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  photoTile: { width: '48.5%' },
  photo: { width: '100%', aspectRatio: 1, borderRadius: Radius.medium },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.round,
  },
  coverLabel: { fontSize: 12, fontFamily: Fonts.medium },
  photoButtons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  choosePhoto: { flex: 1 },
  camera: {
    width: 54,
    height: 54,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
