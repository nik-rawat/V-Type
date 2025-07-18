import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let bucket;

export const initGridFS = () => {
  return new Promise((resolve, reject) => {
    const conn = mongoose.connection;
    
    if (conn.readyState === 1) {
      // Connection is already open
      try {
        bucket = new GridFSBucket(conn.db, {
          bucketName: 'profilePictures'
        });
        console.log('GridFS initialized successfully');
        resolve();
      } catch (error) {
        reject(error);
      }
    } else {
      // Wait for connection to open
      conn.once('open', () => {
        try {
          bucket = new GridFSBucket(conn.db, {
            bucketName: 'profilePictures'
          });
          console.log('GridFS initialized successfully');
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      conn.once('error', (error) => {
        reject(error);
      });
    }
  });
};

export const getGridFSBucket = () => {
  if (!bucket) {
    throw new Error('GridFS not initialized');
  }
  return bucket;
};

// Helper function to delete file from GridFS
export const deleteFromGridFS = async (fileId) => {
  try {
    const bucket = getGridFSBucket();
    await bucket.delete(new mongoose.Types.ObjectId(fileId));
    console.log(`Deleted file from GridFS: ${fileId}`);
  } catch (error) {
    console.error('Error deleting file from GridFS:', error);
  }
};