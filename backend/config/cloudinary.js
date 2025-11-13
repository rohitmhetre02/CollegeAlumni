import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dwzk5ytq6',
  api_key: process.env.CLOUDINARY_API_KEY || '846525666816964',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'hLJW5hXNx7tMJfp4LG50IHQezCg',
  secure: true
});

export default cloudinary;



