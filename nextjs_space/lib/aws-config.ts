import { S3Client } from '@aws-sdk/client-s3';

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME ?? '',
    folderPrefix: process.env.AWS_FOLDER_PREFIX ?? '',
  };
}

/**
 * Create an S3 client.
 *
 * - On Abacus hosting (no custom env), this returns a default AWS S3 client
 *   that uses the ambient credential chain (AWS_PROFILE / IAM role). Behaviour
 *   is unchanged from before.
 * - For self-hosting, set AWS_ENDPOINT (e.g. a MinIO or other S3-compatible
 *   endpoint) plus AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY to route storage
 *   to your own bucket. When AWS_ENDPOINT is set, path-style addressing is used
 *   by default (required by MinIO).
 */
export function createS3Client() {
  const endpoint = process.env.AWS_ENDPOINT || process.env.S3_ENDPOINT;
  const region = process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  const config: any = { region };

  if (endpoint) {
    config.endpoint = endpoint;
    // MinIO and most S3-compatible servers require path-style URLs.
    config.forcePathStyle =
      (process.env.S3_FORCE_PATH_STYLE ?? 'true').toLowerCase() !== 'false';
  }

  // Use explicit credentials when provided; otherwise fall back to the
  // default AWS credential provider chain (profile / env / IAM role).
  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }

  return new S3Client(config);
}

/**
 * Build the public base URL for objects when serving public files.
 * Returns null when using default AWS behaviour (caller builds the AWS URL).
 */
export function getPublicEndpointBase(): string | null {
  const base =
    process.env.AWS_PUBLIC_ENDPOINT ||
    process.env.AWS_ENDPOINT ||
    process.env.S3_ENDPOINT;
  return base ? base.replace(/\/$/, '') : null;
}
