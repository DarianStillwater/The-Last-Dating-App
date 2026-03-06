export interface MetadataValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateMetadata(metadata: unknown): MetadataValidationResult {
  if (!metadata || typeof metadata !== 'object') {
    return { valid: false, reason: 'Missing device metadata.' };
  }

  const meta = metadata as Record<string, unknown>;

  if (meta.camera_facing !== 'front') {
    return { valid: false, reason: 'Photo must be taken with the front camera.' };
  }

  if (meta.capture_method !== 'camera') {
    return { valid: false, reason: 'Photo must be captured from the camera, not uploaded from gallery.' };
  }

  if (typeof meta.captured_at !== 'string') {
    return { valid: false, reason: 'Missing capture timestamp.' };
  }

  const capturedAt = new Date(meta.captured_at);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (isNaN(capturedAt.getTime()) || capturedAt < fiveMinutesAgo) {
    return { valid: false, reason: 'Photo is too old. Please take a fresh selfie.' };
  }

  if (!meta.on_device_face_detected) {
    return { valid: false, reason: 'No face was detected on-device. Please position your face in the frame.' };
  }

  return { valid: true };
}
