import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig, getPublicEndpointBase } from './aws-config';

function shouldServeInline(contentType: string): boolean {
  // image/svg+xml excluded — SVGs can execute embedded scripts (XSS risk)
  return (
    (contentType.startsWith('image/') && contentType !== 'image/svg+xml') ||
    contentType.startsWith('video/') ||
    contentType.startsWith('audio/')
  );
}

/**
 * Generate a presigned URL for uploading a file (single-part, ≤5GB).
 * Returns the upload URL and the cloud_storage_path to store in the DB.
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false,
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  const s3 = createS3Client();
  const { bucketName, folderPrefix } = getBucketConfig();

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${Date.now()}-${safeName}`
    : `${folderPrefix}uploads/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return { uploadUrl, cloud_storage_path };
}

/**
 * Build a public or signed URL to serve a stored file.
 */
export async function getFileUrl(
  cloud_storage_path: string,
  contentType: string,
  isPublic: boolean,
): Promise<string> {
  const { bucketName } = getBucketConfig();
  const region = process.env.AWS_REGION ?? 'us-east-1';

  if (isPublic) {
    const encoded = cloud_storage_path
      .split('/')
      .map(encodeURIComponent)
      .join('/');
    // Self-hosted / S3-compatible storage (e.g. MinIO): use path-style URL.
    const publicBase = getPublicEndpointBase();
    if (publicBase) {
      return `${publicBase}/${bucketName}/${encoded}`;
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/${encoded}`;
  }

  const s3 = createS3Client();
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ResponseContentDisposition: shouldServeInline(contentType)
      ? 'inline'
      : 'attachment',
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deleteFile(cloud_storage_path: string): Promise<void> {
  const s3 = createS3Client();
  const { bucketName } = getBucketConfig();
  await s3.send(
    new DeleteObjectCommand({ Bucket: bucketName, Key: cloud_storage_path }),
  );
}
