require("dotenv").config();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function testUpload() {
  console.log("--- Cloudinary Connection Test ---");
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  
  try {
    // Attempting to upload a sample image (Google logo as a test)
    const result = await cloudinary.uploader.upload("https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png", {
      folder: "test_upload",
    });
    
    console.log("✅ Success! Image uploaded.");
    console.log("Image URL:", result.secure_url);
    console.log("----------------------------------");
  } catch (error) {
    console.error("❌ Error during upload:", error.message);
    console.log("----------------------------------");
  }
}

testUpload();
