import { v2 as cloudinary } from 'cloudinary';
import { ENV } from '../config/env.js';
import { logInfo, logError } from './logger.service.js';
import multer from 'multer';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: ENV.CLOUDINARY.CLOUD_NAME,
  api_key: ENV.CLOUDINARY.API_KEY,
  api_secret: ENV.CLOUDINARY.API_SECRET,
});

// File type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const ALLOWED_FONT_TYPES = ['font/woff', 'font/woff2', 'font/ttf', 'font/otf', 'application/font-woff', 'application/font-woff2'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FONT_SIZE = 5 * 1024 * 1024; // 5MB

// Multer configuration for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  const allAllowedTypes = [
    ...ALLOWED_IMAGE_TYPES,
    ...ALLOWED_VIDEO_TYPES,
    ...ALLOWED_DOCUMENT_TYPES,
    ...ALLOWED_FONT_TYPES,
  ];

  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
  }
};

// Multer upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Set to max possible size, will check specific limits in upload functions
  },
});

// Helper function to determine asset type
const getAssetType = (mimetype) => {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return 'image';
  if (ALLOWED_VIDEO_TYPES.includes(mimetype)) return 'video';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimetype)) return 'document';
  if (ALLOWED_FONT_TYPES.includes(mimetype)) return 'font';
  return 'other';
};

// Helper function to get max size for asset type
const getMaxSize = (assetType) => {
  switch (assetType) {
    case 'image': return MAX_IMAGE_SIZE;
    case 'video': return MAX_VIDEO_SIZE;
    case 'document': return MAX_DOCUMENT_SIZE;
    case 'font': return MAX_FONT_SIZE;
    default: return MAX_IMAGE_SIZE;
  }
};

// Upload to Cloudinary from buffer
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Upload image
export const uploadImage = async (file, folder = 'evolyte/images', options = {}) => {
  try {
    const assetType = getAssetType(file.mimetype);
    
    if (assetType !== 'image') {
      throw new Error('Le fichier doit être une image');
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`L'image ne doit pas dépasser ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }

    const uploadOptions = {
      folder,
      resource_type: 'image',
      transformation: options.transformation || [
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
      ...options,
    };

    const result = await uploadToCloudinary(file.buffer, uploadOptions);

    logInfo('Image uploaded successfully', {
      publicId: result.public_id,
      url: result.secure_url,
      size: file.size,
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      type: 'image',
      filename: file.originalname,
    };
  } catch (error) {
    logError('Failed to upload image', error, {
      filename: file.originalname,
      size: file.size,
    });
    throw error;
  }
};

// Upload video
export const uploadVideo = async (file, folder = 'evolyte/videos', options = {}) => {
  try {
    const assetType = getAssetType(file.mimetype);
    
    if (assetType !== 'video') {
      throw new Error('Le fichier doit être une vidéo');
    }

    if (file.size > MAX_VIDEO_SIZE) {
      throw new Error(`La vidéo ne doit pas dépasser ${MAX_VIDEO_SIZE / 1024 / 1024}MB`);
    }

    const uploadOptions = {
      folder,
      resource_type: 'video',
      ...options,
    };

    const result = await uploadToCloudinary(file.buffer, uploadOptions);

    logInfo('Video uploaded successfully', {
      publicId: result.public_id,
      url: result.secure_url,
      size: file.size,
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      secureUrl: result.secure_url,
      format: result.format,
      duration: result.duration,
      bytes: result.bytes,
      type: 'video',
      filename: file.originalname,
    };
  } catch (error) {
    logError('Failed to upload video', error, {
      filename: file.originalname,
      size: file.size,
    });
    throw error;
  }
};

// Upload document
export const uploadDocument = async (file, folder = 'evolyte/documents', options = {}) => {
  try {
    const assetType = getAssetType(file.mimetype);
    
    if (assetType !== 'document') {
      throw new Error('Le fichier doit être un document (PDF, Word, Text)');
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      throw new Error(`Le document ne doit pas dépasser ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`);
    }

    const uploadOptions = {
      folder,
      resource_type: 'raw',
      ...options,
    };

    const result = await uploadToCloudinary(file.buffer, uploadOptions);

    logInfo('Document uploaded successfully', {
      publicId: result.public_id,
      url: result.secure_url,
      size: file.size,
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      type: 'document',
      filename: file.originalname,
    };
  } catch (error) {
    logError('Failed to upload document', error, {
      filename: file.originalname,
      size: file.size,
    });
    throw error;
  }
};

// Upload font
export const uploadFont = async (file, folder = 'evolyte/fonts', options = {}) => {
  try {
    const assetType = getAssetType(file.mimetype);
    
    if (assetType !== 'font') {
      throw new Error('Le fichier doit être une police (WOFF, WOFF2, TTF, OTF)');
    }

    if (file.size > MAX_FONT_SIZE) {
      throw new Error(`La police ne doit pas dépasser ${MAX_FONT_SIZE / 1024 / 1024}MB`);
    }

    const uploadOptions = {
      folder,
      resource_type: 'raw',
      ...options,
    };

    const result = await uploadToCloudinary(file.buffer, uploadOptions);

    logInfo('Font uploaded successfully', {
      publicId: result.public_id,
      url: result.secure_url,
      size: file.size,
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      secureUrl: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      type: 'font',
      filename: file.originalname,
    };
  } catch (error) {
    logError('Failed to upload font', error, {
      filename: file.originalname,
      size: file.size,
    });
    throw error;
  }
};

// Generic upload function (auto-detects type)
export const uploadAsset = async (file, folder = 'evolyte/assets', options = {}) => {
  const assetType = getAssetType(file.mimetype);

  switch (assetType) {
    case 'image':
      return uploadImage(file, folder, options);
    case 'video':
      return uploadVideo(file, folder, options);
    case 'document':
      return uploadDocument(file, folder, options);
    case 'font':
      return uploadFont(file, folder, options);
    default:
      throw new Error(`Type de fichier non supporté: ${file.mimetype}`);
  }
};

// Delete asset from Cloudinary
export const deleteAsset = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    logInfo('Asset deleted successfully', {
      publicId,
      result: result.result,
    });

    return result;
  } catch (error) {
    logError('Failed to delete asset', error, { publicId });
    throw error;
  }
};

// Delete multiple assets
export const deleteMultipleAssets = async (publicIds, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });

    logInfo('Multiple assets deleted', {
      count: publicIds.length,
      deleted: Object.keys(result.deleted).length,
    });

    return result;
  } catch (error) {
    logError('Failed to delete multiple assets', error, {
      count: publicIds.length,
    });
    throw error;
  }
};

// Get asset details
export const getAssetDetails = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      createdAt: result.created_at,
    };
  } catch (error) {
    logError('Failed to get asset details', error, { publicId });
    throw error;
  }
};

// Generate transformation URL for images
export const getTransformedImageUrl = (publicId, transformations = {}) => {
  try {
    const url = cloudinary.url(publicId, {
      ...transformations,
      secure: true,
    });

    return url;
  } catch (error) {
    logError('Failed to generate transformed URL', error, { publicId });
    throw error;
  }
};

// Common transformations
export const imageTransformations = {
  thumbnail: { width: 150, height: 150, crop: 'fill', gravity: 'auto' },
  small: { width: 300, height: 300, crop: 'limit' },
  medium: { width: 800, height: 800, crop: 'limit' },
  large: { width: 1600, height: 1600, crop: 'limit' },
  avatar: { width: 200, height: 200, crop: 'fill', gravity: 'face', radius: 'max' },
  banner: { width: 1920, height: 400, crop: 'fill', gravity: 'auto' },
};

// Get storage usage for a folder
export const getStorageUsage = async (folder = 'evolyte') => {
  try {
    const result = await cloudinary.api.usage();
    
    logInfo('Storage usage retrieved', {
      bandwidth: result.bandwidth.usage,
      storage: result.storage.usage,
    });

    return {
      bandwidth: {
        used: result.bandwidth.usage,
        limit: result.bandwidth.limit,
        percentage: (result.bandwidth.usage / result.bandwidth.limit) * 100,
      },
      storage: {
        used: result.storage.usage,
        limit: result.storage.limit,
        percentage: (result.storage.usage / result.storage.limit) * 100,
      },
      transformations: result.transformations,
    };
  } catch (error) {
    logError('Failed to get storage usage', error);
    throw error;
  }
};

// Validate storage limit for user/project
export const validateStorageLimit = async (userId, currentUsage, maxLimit) => {
  if (currentUsage >= maxLimit) {
    throw new Error(`Limite de stockage atteinte (${maxLimit / 1024 / 1024}MB)`);
  }
  return true;
};

export default {
  upload,
  uploadImage,
  uploadVideo,
  uploadDocument,
  uploadFont,
  uploadAsset,
  deleteAsset,
  deleteMultipleAssets,
  getAssetDetails,
  getTransformedImageUrl,
  imageTransformations,
  getStorageUsage,
  validateStorageLimit,
};
