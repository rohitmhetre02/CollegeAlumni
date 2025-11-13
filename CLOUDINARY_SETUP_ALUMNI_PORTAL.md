# Cloudinary Setup Guide for `alumni_portal` Preset

## Quick Setup Steps

### 1. Configure Your `.env` Files

Make sure both `.env` files have the correct values:

**`admin-panel/.env`:**
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=alumni_portal
VITE_API_URL=http://localhost:5000/api
```

**`alumni-panel/.env`:**
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=alumni_portal
VITE_API_URL=http://localhost:5000/api
```

**Replace `your_cloud_name_here` with your actual Cloudinary Cloud Name from the dashboard.**

### 2. Configure Upload Preset in Cloudinary Dashboard

1. **Go to Cloudinary Dashboard**: https://cloudinary.com/console
2. **Navigate to Settings**: Click on "Settings" in the top menu
3. **Go to Upload Tab**: Click on "Upload" in the left sidebar
4. **Scroll to Upload Presets**: Find the "Upload presets" section
5. **Find or Create Preset**:
   - If `alumni_portal` preset exists: Click on it to edit
   - If it doesn't exist: Click "Add upload preset" and name it `alumni_portal`
6. **Configure the Preset**:
   - **Preset name**: `alumni_portal` (must match exactly)
   - **Signing mode**: Select **"Unsigned"** (THIS IS CRITICAL!)
   - **Folder**: `alumni_portal` (optional - for organization)
   - **Access mode**: Public
7. **Save**: Click "Save" at the bottom of the page

### 3. Restart Development Servers

After configuring the `.env` files, restart both servers:

```bash
# Stop current servers (Ctrl+C)

# Restart Admin Panel
cd admin-panel
npm run dev

# Restart Alumni Panel (in a new terminal)
cd alumni-panel
npm run dev
```

## Verification

After setup, test the upload:

1. Go to Profile page
2. Click on profile picture or "Upload Picture" button
3. Select an image file (JPG, PNG, or GIF, max 5MB)
4. The image should upload and display immediately

## Troubleshooting

### Error: "Upload preset must be whitelisted for unsigned uploads"

**Solution**: The preset `alumni_portal` is not set to "Unsigned" mode.

1. Go to Cloudinary Dashboard > Settings > Upload > Upload presets
2. Find `alumni_portal` preset
3. Click on it
4. Change "Signing mode" to **"Unsigned"**
5. Click "Save"
6. Try uploading again

### Error: "Cloudinary cloud name is not configured"

**Solution**: Your `.env` file is missing or has incorrect values.

1. Check that `.env` file exists in `admin-panel/` and `alumni-panel/` folders
2. Verify `VITE_CLOUDINARY_CLOUD_NAME` has your actual cloud name
3. Verify `VITE_CLOUDINARY_UPLOAD_PRESET=alumni_portal`
4. Restart the development server

### Image Uploads but Doesn't Save

**Solution**: Check browser console for errors. The profile picture should save automatically after upload. If it doesn't:
1. Check network tab in browser DevTools
2. Verify backend API is running
3. Check that user is logged in

## Features Working

✅ Profile picture upload (all roles: admin, coordinator, student, alumni)
✅ Resume upload (all roles)
✅ Automatic save to backend
✅ Display in profile circle
✅ Display in Topbar
✅ Real-time updates across the app

## Support

If you continue to have issues:
1. Check browser console for detailed error messages
2. Verify Cloudinary dashboard settings
3. Ensure `.env` files are in the correct locations
4. Make sure development servers are restarted after `.env` changes



