import { Handler } from '@netlify/functions';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const DEFAULT_EXPIRATION_SECONDS = 60 * 60;
const MAX_EXPIRATION_SECONDS = 60 * 60 * 6;

const videoKeysByUnit: Record<string, string | undefined> = {
  '1': process.env.R2_UNIT_1_VIDEO_KEY,
  '2': process.env.R2_UNIT_2_VIDEO_KEY,
  '3': process.env.R2_UNIT_3_VIDEO_KEY,
  '4': process.env.R2_UNIT_4_VIDEO_KEY,
  '5': process.env.R2_UNIT_5_VIDEO_KEY,
  '6': process.env.R2_UNIT_6_VIDEO_KEY,
  '7': process.env.R2_UNIT_7_VIDEO_KEY,
};

const jsonResponse = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const getRequiredEnv = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 video signing environment variables are not configured.');
  }

  return { accountId, bucketName, accessKeyId, secretAccessKey };
};

const getExpirationSeconds = () => {
  const configuredValue = Number(process.env.R2_SIGNED_URL_EXPIRES_SECONDS);

  if (!Number.isFinite(configuredValue) || configuredValue <= 0) {
    return DEFAULT_EXPIRATION_SECONDS;
  }

  return Math.min(Math.floor(configuredValue), MAX_EXPIRATION_SECONDS);
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  const unit = event.queryStringParameters?.unit;
  const objectKey = unit ? videoKeysByUnit[unit] : null;

  if (!unit || !objectKey) {
    return jsonResponse(400, { error: 'Unknown or unconfigured video unit.' });
  }

  try {
    const { accountId, bucketName, accessKeyId, secretAccessKey } = getRequiredEnv();
    const expiresIn = getExpirationSeconds();
    const client = new S3Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      region: 'auto',
    });
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const url = await getSignedUrl(client, command, { expiresIn });

    return jsonResponse(200, {
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      expires_in: expiresIn,
      unit: Number(unit),
      url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected video signing error.';

    console.error('Video URL Error:', err);
    return jsonResponse(500, { error: message });
  }
};
