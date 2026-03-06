// AWS Rekognition wrapper for Supabase Edge Functions (Deno)
// Uses AWS SDK v3 via npm: specifier

import {
  RekognitionClient,
  DetectFacesCommand,
  DetectModerationLabelsCommand,
  CompareFacesCommand,
} from "npm:@aws-sdk/client-rekognition";

const client = new RekognitionClient({
  region: Deno.env.get("AWS_REGION") || "us-east-1",
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
  },
});

// --- DetectFaces ---

export interface FaceDetectionResult {
  faceCount: number;
  confidence: number;
  raw: unknown;
}

export async function detectFaces(imageBytes: Uint8Array): Promise<FaceDetectionResult> {
  const command = new DetectFacesCommand({
    Image: { Bytes: imageBytes },
    Attributes: ["DEFAULT"],
  });

  const response = await client.send(command);
  const faces = response.FaceDetails ?? [];

  return {
    faceCount: faces.length,
    confidence: faces.length > 0 ? (faces[0].Confidence ?? 0) : 0,
    raw: response.FaceDetails,
  };
}

// --- DetectModerationLabels ---

export interface ModerationResult {
  passed: boolean;
  labels: Array<{ Name: string; Confidence: number; ParentName?: string }>;
  maxConfidence: number;
}

export async function detectModerationLabels(
  imageBytes: Uint8Array,
  confidenceThreshold: number,
): Promise<ModerationResult> {
  const command = new DetectModerationLabelsCommand({
    Image: { Bytes: imageBytes },
    MinConfidence: 50,
  });

  const response = await client.send(command);
  const labels = (response.ModerationLabels ?? []).map((l) => ({
    Name: l.Name ?? "Unknown",
    Confidence: l.Confidence ?? 0,
    ParentName: l.ParentName ?? undefined,
  }));

  const maxConfidence = labels.reduce((max, l) => Math.max(max, l.Confidence), 0);

  return {
    passed: maxConfidence < confidenceThreshold,
    labels,
    maxConfidence,
  };
}

// --- CompareFaces ---

export interface FaceComparisonResult {
  similarity: number;
  matched: boolean;
  raw: unknown;
}

export async function compareFaces(
  sourceBytes: Uint8Array,
  targetBytes: Uint8Array,
  similarityThreshold: number,
): Promise<FaceComparisonResult> {
  const command = new CompareFacesCommand({
    SourceImage: { Bytes: sourceBytes },
    TargetImage: { Bytes: targetBytes },
    SimilarityThreshold: 50, // Low threshold to get results; we apply our own thresholds
  });

  const response = await client.send(command);
  const matches = response.FaceMatches ?? [];
  const similarity = matches.length > 0 ? (matches[0].Similarity ?? 0) : 0;

  return {
    similarity,
    matched: similarity >= similarityThreshold,
    raw: response,
  };
}
