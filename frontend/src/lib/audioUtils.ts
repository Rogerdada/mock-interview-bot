/**
 * Convert Float32Array PCM samples to Int16Array
 * Clamps values to [-1, 1] before converting
 */
export function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, float32[i]))
    int16[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
  }
  return int16
}

/**
 * Convert Int16Array PCM samples to Float32Array
 */
export function int16ToFloat32(int16: Int16Array): Float32Array {
  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7fff)
  }
  return float32
}

/**
 * Downsample Float32 audio from sourceRate to targetRate
 * Simple linear interpolation downsampler
 */
export function downsample(
  buffer: Float32Array,
  sourceRate: number,
  targetRate: number
): Float32Array {
  if (sourceRate === targetRate) return buffer
  const ratio = sourceRate / targetRate
  const outputLength = Math.floor(buffer.length / ratio)
  const result = new Float32Array(outputLength)
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio
    const floor = Math.floor(srcIndex)
    const ceil = Math.min(floor + 1, buffer.length - 1)
    const frac = srcIndex - floor
    result[i] = buffer[floor] * (1 - frac) + buffer[ceil] * frac
  }
  return result
}

/**
 * Base64-encode an ArrayBuffer
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Decode a base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Calculate RMS amplitude of a Float32Array (0..1)
 */
export function getRmsAmplitude(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i]
  }
  return Math.sqrt(sum / buffer.length)
}
