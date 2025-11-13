import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { auth } from '../middleware/auth.js';
import { Readable } from 'stream';

const router = express.Router();

// Configure Multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, DOC, and DOCX files are allowed.'), false);
    }
  }
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = 'alumni_portal', resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Create a readable stream from buffer
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// Error handling middleware for Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  next();
};

// Upload profile picture
router.post('/profile-picture', auth, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select a file.' });
    }

    // Validate file type (images only)
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed for profile pictures' });
    }

    // Validate file size (max 5MB for images)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image size should be less than 5MB' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'alumni_portal/profile-pictures',
      'image'
    );

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      message: 'Profile picture uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ 
      message: 'Failed to upload profile picture',
      error: error.message 
    });
  }
});

// Upload resume
router.post('/resume', auth, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select a file.' });
    }

    // Validate file type (documents only)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(req.file.mimetype) && 
        !req.file.originalname.match(/\.(pdf|doc|docx)$/i)) {
      return res.status(400).json({ message: 'Only PDF, DOC, and DOCX files are allowed for resumes' });
    }

    // Validate file size (max 10MB for resumes)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'Resume size should be less than 10MB' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'alumni_portal/resumes',
      'auto'
    );

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      message: 'Resume uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ 
      message: 'Failed to upload resume',
      error: error.message 
    });
  }
});

// Upload general image (for news, events, gallery, etc.)
router.post('/image', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file type (images only)
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image files are allowed' });
    }

    // Validate file size (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image size should be less than 5MB' });
    }

    // Get folder from query parameter or use default
    const folder = req.query.folder || 'alumni_portal/images';

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      folder,
      'image'
    );

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message 
    });
  }
});

export default router;

