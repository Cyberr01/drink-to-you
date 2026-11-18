import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PhotoSource = 'camera' | 'gallery';

const MAX_WEB_DIMENSION = 420;
const WEB_JPEG_QUALITY = 0.72;

const NATIVE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.35,
  base64: true,
};

const PERMISSION_DENIED_MESSAGES: Record<PhotoSource, string> = {
  camera: 'Permita o uso da câmera nas configurações do aparelho.',
  gallery: 'Permita o acesso às fotos nas configurações do aparelho.',
};

/* ---------- Web / PWA ---------- */

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Formato de imagem inválido.'));
    image.src = dataUrl;
  });
}

/** Reduz a imagem para no máximo MAX_WEB_DIMENSION px e converte para JPEG comprimido. */
function compressImage(image: HTMLImageElement, originalDataUrl: string) {
  const scale = Math.min(1, MAX_WEB_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext('2d');
  if (!context) return originalDataUrl;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', WEB_JPEG_QUALITY);
}

function selectFileOnWeb(source: PhotoSource): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

async function pickPhotoOnWeb(source: PhotoSource) {
  if (typeof document === 'undefined') return null;
  const file = await selectFileOnWeb(source);
  if (!file) return null;

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  return compressImage(image, dataUrl);
}

/* ---------- Android / iOS nativo ---------- */

async function requestNativePermission(source: PhotoSource) {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error(PERMISSION_DENIED_MESSAGES[source]);
}

async function pickPhotoOnNative(source: PhotoSource) {
  await requestNativePermission(source);
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(NATIVE_PICKER_OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(NATIVE_PICKER_OPTIONS);

  const base64 = result.canceled ? null : result.assets[0]?.base64;
  return base64 ? `data:image/jpeg;base64,${base64}` : null;
}

/** Abre a câmera ou a galeria e devolve a foto como Data URI JPEG (ou null se cancelado). */
export function pickCheckinPhoto(source: PhotoSource): Promise<string | null> {
  return Platform.OS === 'web' ? pickPhotoOnWeb(source) : pickPhotoOnNative(source);
}
