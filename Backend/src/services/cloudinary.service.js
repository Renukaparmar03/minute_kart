import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const getUploadDir = () => {
    const base = process.env.UPLOAD_DIR || process.env.UPLOAD_PATH || '/var/www/uploads';
    return path.resolve(process.platform === 'win32' && base.startsWith('/var/www/') ? 'C:' + base : base);
};

export const getOptimizedCloudinaryImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    return url;
};

const saveBufferToLocal = async (buffer, _folder = 'uploads', extension = 'webp') => {
    if (!buffer) {
        throw new Error('File buffer is required');
    }

    const uploadBaseDir = getUploadDir();
    if (!fs.existsSync(uploadBaseDir)) {
        fs.mkdirSync(uploadBaseDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${extension}`;
    const filePath = path.join(uploadBaseDir, uniqueFilename);

    await fs.promises.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${uniqueFilename}`;

    return {
        filePath,
        relativeUrl,
        filename: uniqueFilename,
        public_id: uniqueFilename
    };
};

export const uploadImageBuffer = async (buffer, folder = 'uploads') => {
    const result = await saveBufferToLocal(buffer, folder, 'webp');
    return result.relativeUrl;
};

export const uploadImageBufferDetailed = async (buffer, folder = 'uploads') => {
    const result = await saveBufferToLocal(buffer, folder, 'webp');
    return {
        secure_url: result.relativeUrl,
        url: result.relativeUrl,
        public_id: result.public_id
    };
};

export const uploadBufferDetailed = async (
    buffer,
    { folder = 'uploads', resourceType = 'auto' } = {}
) => {
    const ext = resourceType === 'video' ? 'mp4' : 'webp';
    const result = await saveBufferToLocal(buffer, folder, ext);
    return {
        secure_url: result.relativeUrl,
        url: result.relativeUrl,
        public_id: result.public_id,
        resourceType
    };
};
