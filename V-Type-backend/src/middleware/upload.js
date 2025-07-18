import multer from 'multer';
import path from 'path';
import { getGridFSBucket, deleteFromGridFS } from '../config/gridfs.js';
import mongoose from 'mongoose';

// Configure multer for memory storage (we'll stream to GridFS)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

export const uploadProfilePicture = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
}).single('profilePicture');

// Function to upload file to GridFS
export const uploadToGridFS = (file, userId) => {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      
      if (!bucket) {
        return reject(new Error('GridFS bucket not available'));
      }

      const filename = `profile-${userId}-${Date.now()}${path.extname(file.originalname)}`;
      
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: {
          userId: userId,
          originalName: file.originalname,
          uploadDate: new Date(),
          mimetype: file.mimetype
        }
      });

      uploadStream.on('error', (error) => {
        console.error('GridFS upload error:', error);
        reject(error);
      });

      uploadStream.on('finish', () => {
        console.log(`File uploaded to GridFS: ${filename}`);
        resolve({
          fileId: uploadStream.id,
          filename: filename
        });
      });

      // Write file buffer to GridFS
      uploadStream.end(file.buffer);
    } catch (error) {
      console.error('Error in uploadToGridFS:', error);
      reject(error);
    }
  });
};

// Function to get file stream from GridFS
export const getFileStreamFromGridFS = (fileId) => {
  try {
    const bucket = getGridFSBucket();
    return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    throw error;
  }
};

// Function to remove old profile picture from GridFS
export const removeOldProfilePicture = async (profilePictureId) => {
  if (!profilePictureId || profilePictureId.includes('example.com')) {
    return; // Don't try to remove default or external URLs
  }

  try {
    // Extract file ID from the profile picture reference
    if (mongoose.Types.ObjectId.isValid(profilePictureId)) {
      await deleteFromGridFS(profilePictureId);
    }
  } catch (error) {
    console.error('Error removing old profile picture:', error);
  }
};

// Middleware to handle upload errors
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  
  next();
};