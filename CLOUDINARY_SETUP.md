# Cloudinary Image Upload Setup Guide

## Overview
This project uses Cloudinary for image uploads in News and Events. Images are uploaded directly from the frontend to Cloudinary using unsigned upload presets.

## Setup Instructions

### 1. Get Cloudinary Credentials

1. Sign up for a free Cloudinary account at https://cloudinary.com/
2. Go to your Cloudinary Dashboard: https://cloudinary.com/console
3. Note down your **Cloud Name** from the dashboard

### 2. Create an Upload Preset

1. In Cloudinary Dashboard, go to **Settings** → **Upload**
2. Scroll down to **Upload presets** section
3. Click **Add upload preset**
4. Configure the preset:
   - **Preset name**: `alumni_portal_upload` (or any name you prefer)
   - **Signing mode**: Select **Unsigned** (important for frontend uploads)
   - **Folder**: `alumni_portal` (optional - to organize uploads)
   - **Access mode**: Public
   - Click **Save**

### 3. Configure Environment Variables

Create a `.env` file in the `alumni-panel` directory with the following:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name_here

# API Base URL
VITE_API_URL=http://localhost:5000/api
```

**Replace:**
- `your_cloud_name_here` with your actual Cloud Name from Cloudinary Dashboard
- `your_upload_preset_name_here` with the preset name you created (e.g., `alumni_portal_upload`)

### 4. Restart Development Server

After adding the environment variables, restart your development server:

```bash
cd alumni-panel
npm run dev
```

## Usage

### News Image Upload
1. Navigate to News page
2. Click "Create News"
3. Fill in the news details
4. Under "Image" section, click "Choose File" to select an image
5. Image will be uploaded to Cloudinary automatically
6. Preview will show the uploaded image
7. Click "Create News" to save

### Event Image Upload
1. Navigate to Events page
2. Click "Create Event"
3. Fill in the event details
4. Under "Image" section, click "Choose File" to select an image
5. Image will be uploaded to Cloudinary automatically
6. Preview will show the uploaded image
7. Click "Create Event" to save

## Image Requirements
- **Formats**: JPG, PNG, GIF
- **Maximum Size**: 5MB
- **Recommendation**: Use images optimized for web (compressed)

## Features
- ✅ Direct upload to Cloudinary from frontend
- ✅ Image preview before submission
- ✅ Automatic URL generation
- ✅ Images stored securely in Cloudinary
- ✅ Images displayed in News and Event cards
- ✅ Fallback option to enter image URL manually

## Troubleshooting

### Upload fails
- Check that `.env` file has correct values
- Verify upload preset is set to "Unsigned"
- Check Cloudinary dashboard for upload errors
- Ensure image file size is under 5MB

### Images not displaying
- Verify the image URL is saved in database
- Check browser console for image loading errors
- Ensure Cloudinary image URLs are accessible

## Files Modified
- `alumni-panel/src/pages/NewsWithSidebar.jsx` - Added image upload
- `alumni-panel/src/pages/EventsWithSidebar.jsx` - Added image upload
- `alumni-panel/src/utils/cloudinary.js` - Cloudinary upload utility

## Backend
No backend changes needed - images are uploaded directly to Cloudinary from the frontend, and only the image URL is stored in the database.

