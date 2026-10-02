import fs from 'fs';
import path from 'path';
import { ApiError } from './ApiError.js';

const DATA_URL_PATTERN = /^data:([^;]+);base64,(.+)$/;

const getUploadDir = () => {
  const base = process.env.UPLOAD_DIR || process.env.UPLOAD_PATH || '/var/www/uploads';
  return path.resolve(process.platform === 'win32' && base.startsWith('/var/www/') ? 'C:' + base : base);
};

const parseDataUrl = (dataUrl) => {
  const match = String(dataUrl || '').match(DATA_URL_PATTERN);

  if (!match) {
    throw new ApiError(400, 'A valid base64 image data URL is required');
  }

  const mimeType = match[1];
  const base64 = match[2];
  const extension = mimeType.split('/')[1] || 'jpg';

  return {
    mimeType,
    base64,
    extension,
  };
};

export const uploadDataUrlToCloudinary = async ({
  dataUrl,
  publicIdPrefix = 'document',
  publicIdSuffix = '',
}) => {
  const { mimeType, base64, extension } = parseDataUrl(dataUrl);
  const buffer = Buffer.from(base64, 'base64');
  
  const uploadBaseDir = getUploadDir();
  if (!fs.existsSync(uploadBaseDir)) {
    fs.mkdirSync(uploadBaseDir, { recursive: true });
  }

  const uniqueId = `${publicIdPrefix}-${Date.now()}${publicIdSuffix ? `-${publicIdSuffix}` : ''}`;
  const filename = `${uniqueId}.${extension}`;
  const filePath = path.join(uploadBaseDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  const relativeUrl = `/uploads/${filename}`;

  return {
    secureUrl: relativeUrl,
    publicId: filename,
    resourceType: 'image',
    format: extension,
    bytes: buffer.length,
    originalFilename: filename,
    createdAt: new Date().toISOString(),
    raw: { url: relativeUrl }
  };
};
