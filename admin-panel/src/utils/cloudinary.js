// Cloudinary helper for image upload
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export const uploadImageToCloudinary = async (file) => {
  try {
    // Validate Cloudinary configuration
    if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
      throw new Error('Cloudinary cloud name is not configured. Please check your .env file.');
    }
    if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'your_upload_preset') {
      throw new Error('Cloudinary upload preset is not configured. Please check your .env file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Upload failed with status ${response.status}`;
      
      // Handle specific Cloudinary errors with helpful messages
      if (errorMessage.includes('whitelisted') || errorMessage.includes('unsigned')) {
        throw new Error(
          'Upload preset "alumni_portal" must be configured for unsigned uploads. ' +
          'Please go to Cloudinary Dashboard > Settings > Upload > Upload presets, ' +
          'find the preset named "alumni_portal", click on it, and set "Signing mode" to "Unsigned". ' +
          'Then click "Save" at the bottom. After saving, try uploading again.'
        );
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error('No secure URL returned from Cloudinary');
    }
    return data.secure_url; // Return the secure URL of the uploaded image
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

export const uploadResumeToCloudinary = async (file) => {
  try {
    // Validate Cloudinary configuration
    if (!CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
      throw new Error('Cloudinary cloud name is not configured. Please check your .env file.');
    }
    if (!CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET === 'your_upload_preset') {
      throw new Error('Cloudinary upload preset is not configured. Please check your .env file.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'auto'); // Allow PDF and other file types

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Upload failed with status ${response.status}`;
      
      // Handle specific Cloudinary errors with helpful messages
      if (errorMessage.includes('whitelisted') || errorMessage.includes('unsigned')) {
        throw new Error(
          'Upload preset "alumni_portal" must be configured for unsigned uploads. ' +
          'Please go to Cloudinary Dashboard > Settings > Upload > Upload presets, ' +
          'find the preset named "alumni_portal", click on it, and set "Signing mode" to "Unsigned". ' +
          'Then click "Save" at the bottom. After saving, try uploading again.'
        );
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.secure_url) {
      throw new Error('No secure URL returned from Cloudinary');
    }
    return data.secure_url; // Return the secure URL of the uploaded file
  } catch (error) {
    console.error('Error uploading resume to Cloudinary:', error);
    throw error;
  }
};

