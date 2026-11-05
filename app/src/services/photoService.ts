import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const MAX_WEB_DIMENSION = 420;

function pickAndResizeOnWeb(useCamera: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (useCamera) {
      input.setAttribute('capture', 'environment');
    }

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const scale = Math.min(1, MAX_WEB_DIMENSION / Math.max(img.width, img.height));
          const width = Math.round(img.width * scale);
          const height = Math.round(img.height * scale);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = () => resolve(null);
        img.src = reader.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    input.click();
  });
}

export async function pickCheckinPhoto(source: 'camera' | 'gallery'): Promise<string | null> {
  if (Platform.OS === 'web') {
    return pickAndResizeOnWeb(source === 'camera');
  }

  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new Error('Permita o uso da câmera nas configurações do aparelho.');
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.35,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return null;
    return `data:image/jpeg;base64,${result.assets[0].base64}`;
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Permita o acesso às fotos nas configurações do aparelho.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.35,
    base64: true,
  });
  if (result.canceled || !result.assets[0]?.base64) return null;
  return `data:image/jpeg;base64,${result.assets[0].base64}`;
}
