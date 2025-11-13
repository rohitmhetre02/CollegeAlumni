// Backend upload utility - sends files to backend which then uploads to Cloudinary
import api from '../config/api';

export const uploadImageToBackend = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/profile-picture', formData);

    if (response.data && response.data.url) {
      return response.data.url;
    }
    throw new Error('No URL returned from server');
  } catch (error) {
    console.error('Error uploading image to backend:', error);
    const errorMessage = error?.response?.data?.message || 
                        error?.response?.data?.error || 
                        error?.message || 
                        'Failed to upload image';
    throw new Error(errorMessage);
  }
};

export const uploadResumeToBackend = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/resume', formData);

    if (response.data && response.data.url) {
      return response.data.url;
    }
    throw new Error('No URL returned from server');
  } catch (error) {
    console.error('Error uploading resume to backend:', error);
    const errorMessage = error?.response?.data?.message || 
                        error?.response?.data?.error || 
                        error?.message || 
                        'Failed to upload resume';
    throw new Error(errorMessage);
  }
};

export const uploadGeneralImageToBackend = async (file, folder = 'images') => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/upload/image?folder=${folder}`, formData);

    if (response.data && response.data.url) {
      return response.data.url;
    }
    throw new Error('No URL returned from server');
  } catch (error) {
    console.error('Error uploading image to backend:', error);
    const errorMessage = error?.response?.data?.message || 
                        error?.response?.data?.error || 
                        error?.message || 
                        'Failed to upload image';
    throw new Error(errorMessage);
  }
};

