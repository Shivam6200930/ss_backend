 // Import your user model
 import {v2 as cloudinary} from 'cloudinary';
 import { user } from "../models/user.js";
 import dotenv from 'dotenv'
 dotenv.config()
// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.YOUR_CLOUD_NAME,
    api_key: process.env.YOUR_API_KEY,
    api_secret: process.env.YOUR_API_SECRET
  });


let imageupload=async(req, res) =>{
    // const {fromData}=req.files.image
    try {
        // Check if image file exists
        if (!req.files || !req.files.image) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.files.image.path);
        const imageUrl = result.secure_url;
        console.log(`image:${imageUrl}`);
        const id = req.params.id; 
        await user.findByIdAndUpdate(id, { profileImageUrl: imageUrl });
        res.json({ image: imageUrl, message: 'Image uploaded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
}

export default imageupload;
