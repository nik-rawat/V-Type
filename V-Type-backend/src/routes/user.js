import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { 
  uploadProfilePicture, 
  handleUploadError, 
  uploadToGridFS, 
  removeOldProfilePicture,
  getFileStreamFromGridFS 
} from '../middleware/upload.js';
import { getGridFSBucket } from '../config/gridfs.js';
import User from '../models/user.js';
import mongoose from 'mongoose';
import {
  getUserProfile,
  updateProfile,
  changePassword,
  searchUsers,
  deactivateAccount,
  reactivateAccount
} from '../controllers/userController.js';

const router = express.Router();

// Get user profile by ID
router.get('/profile/:userId', authenticateToken, getUserProfile);

// Update user profile
router.put('/profile', [
  authenticateToken,
  body('username').optional().isLength({ min: 3, max: 30 }).trim().escape(),
  body('bio').optional().isLength({ max: 500 }).trim()
], updateProfile);

// Update profile picture (file upload to GridFS)
router.put('/profile-picture', 
  authenticateToken, 
  uploadProfilePicture, 
  handleUploadError, 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Get current user to access old profile picture
      const currentUser = await User.findById(req.user._id);
      
      // Upload file to GridFS
      const { fileId, filename } = await uploadToGridFS(req.file, req.user._id);

      // Generate URL for the uploaded file
      const profilePictureUrl = `/api/users/profile-picture/${fileId}`;

      // Update user's profile picture in database
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { 
          profilePicture: profilePictureUrl,
          profilePictureId: fileId
        },
        { new: true, runValidators: true }
      ).select('-password');

      // Remove old profile picture if it exists
      if (currentUser.profilePictureId) {
        removeOldProfilePicture(currentUser.profilePictureId);
      }

      res.json({
        message: 'Profile picture updated successfully',
        profilePicture: profilePictureUrl,
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          profilePicture: updatedUser.profilePicture,
          bio: updatedUser.bio,
          isActive: updatedUser.isActive,
          lastLogin: updatedUser.lastLogin,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      });
    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get profile picture from GridFS with improved handling
router.get('/profile-picture/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    const bucket = getGridFSBucket();
    
    // First, get file info to set proper headers
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ message: 'File not found' });
    }

    const file = files[0];
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));

    // Set appropriate headers based on stored metadata
    res.set('Content-Type', file.metadata?.mimetype || 'image/jpeg');
    res.set('Content-Length', file.length);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

    downloadStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        return res.status(404).json({ message: 'File not found' });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Get profile picture error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Change password
router.put('/change-password', [
  authenticateToken,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], changePassword);

// Search users
router.get('/search', authenticateToken, searchUsers);

// Deactivate account
router.put('/deactivate', authenticateToken, deactivateAccount);

// Reactivate account
router.put('/reactivate', authenticateToken, reactivateAccount);

export default router;