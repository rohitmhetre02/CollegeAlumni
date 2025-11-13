# Backend File Upload Setup with Multer and Cloudinary

## ✅ Setup Complete!

Your backend is now configured to handle file uploads using Multer and Cloudinary.

## Backend Configuration

### 1. Install Dependencies

Run this command in the `backend` directory:
```bash
cd backend
npm install multer cloudinary
```

### 2. Create Backend `.env` File

Create a file named `.env` in the `backend` directory with:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dwzk5ytq6
CLOUDINARY_API_KEY=846525666816964
CLOUDINARY_API_SECRET=hLJW5hXNx7tMJfp4LG50IHQezCg

# Server Port
PORT=5000
```

### 3. Restart Backend Server

After creating the `.env` file, restart your backend server:
```bash
cd backend
npm run dev
```

## How It Works

### Upload Flow:
1. **Frontend** → User selects file
2. **Frontend** → Sends file to backend API (`/api/upload/profile-picture`, `/api/upload/resume`, or `/api/upload/image`)
3. **Backend** → Receives file using Multer (stores in memory)
4. **Backend** → Uploads to Cloudinary using Cloudinary SDK
5. **Backend** → Returns Cloudinary URL to frontend
6. **Frontend** → Saves URL to database via profile update API

### Upload Endpoints:

#### Profile Picture Upload
- **Endpoint**: `POST /api/upload/profile-picture`
- **Auth**: Required (JWT token)
- **File**: Single image file (JPG, PNG, GIF)
- **Max Size**: 5MB
- **Returns**: `{ success: true, url: "https://...", publicId: "...", message: "..." }`

#### Resume Upload
- **Endpoint**: `POST /api/upload/resume`
- **Auth**: Required (JWT token)
- **File**: Single document file (PDF, DOC, DOCX)
- **Max Size**: 10MB
- **Returns**: `{ success: true, url: "https://...", publicId: "...", message: "..." }`

#### General Image Upload
- **Endpoint**: `POST /api/upload/image?folder=alumni_portal/news`
- **Auth**: Required (JWT token)
- **File**: Single image file (JPG, PNG, GIF)
- **Max Size**: 5MB
- **Query Params**: `folder` (optional, default: `alumni_portal/images`)
- **Returns**: `{ success: true, url: "https://...", publicId: "...", message: "..." }`

## Cloudinary Storage Structure

Files are organized in Cloudinary folders:
- **Profile Pictures**: `alumni_portal/profile-pictures/`
- **Resumes**: `alumni_portal/resumes/`
- **News Images**: `alumni_portal/news/`
- **Event Images**: `alumni_portal/events/`
- **Gallery Images**: `alumni_portal/gallery/`
- **General Images**: `alumni_portal/images/`

## Features

✅ **Secure Upload**: All uploads require authentication
✅ **File Validation**: Type and size validation on backend
✅ **Automatic Organization**: Files organized in Cloudinary folders
✅ **URL Storage**: Cloudinary URLs saved to MongoDB
✅ **Error Handling**: Comprehensive error messages
✅ **Memory Efficient**: Files stored in memory (no disk storage needed)

## Frontend Changes

All frontend upload functions have been updated to use backend endpoints:
- `uploadImageToBackend()` - Profile pictures
- `uploadResumeToBackend()` - Resumes
- `uploadGeneralImageToBackend(file, folder)` - General images

## Testing

1. **Test Profile Picture Upload**:
   - Go to Profile page
   - Click "Upload Picture"
   - Select an image
   - Should upload and display immediately

2. **Test Resume Upload**:
   - Go to Profile page
   - Scroll to Resume section
   - Click "Upload Resume"
   - Select a PDF/DOC file
   - Should upload and save

3. **Test News/Event Image Upload**:
   - Go to News or Events page
   - Create new item
   - Upload image
   - Should upload and display

## Troubleshooting

### Error: "No file uploaded"
- Check that file input is working
- Verify file is selected before upload

### Error: "Invalid file type"
- Profile pictures: Only JPG, PNG, GIF
- Resumes: Only PDF, DOC, DOCX
- Check file extension matches allowed types

### Error: "File size too large"
- Profile pictures: Max 5MB
- Resumes: Max 10MB
- Compress or resize file before upload

### Error: "Failed to upload to Cloudinary"
- Check backend `.env` file has correct Cloudinary credentials
- Verify Cloudinary account is active
- Check backend server logs for detailed error

### Files not showing after upload
- Check browser console for errors
- Verify backend returned URL
- Check database has saved the URL
- Verify Cloudinary URL is accessible

## Security Notes

- All upload endpoints require JWT authentication
- Files are validated before upload
- File sizes are limited
- Only allowed file types are accepted
- Cloudinary credentials are stored securely in backend `.env`



