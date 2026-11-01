import * as Location from 'expo-location';

const LOCATION_TIMEOUT_MS = 20_000;

// Rejects with a message that can be shown to the user as it is
export const getCurrentCoords = async () => {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) {
    // Android stops showing its prompt after a refusal, so settings is the only way back
    throw new Error('Location access is off. Allow it for this app in your phone settings.');
  }

  try {
    // The settings dialog asks for Google Location Accuracy, which isn't needed here
    const { coords } = await Promise.race([
      Location.getCurrentPositionAsync({ mayShowUserSettingsDialog: false }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out')), LOCATION_TIMEOUT_MS)
      ),
    ]);
    return coords;
  } catch {
    throw new Error("Couldn't get your location. Check that location is turned on.");
  }
};
