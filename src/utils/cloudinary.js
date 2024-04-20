import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath) => {
  try {

    if (!localFilePath) return "Couldn't find the path of the file";

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    return response;   //returning the url of the file. 

  } catch (error) {
    fs.unlinkSync(localFilePath) //unlinkSync for ensuring that locally saved temporary file must delete, In case file uploding process to cloudinary fails.  
  }
};


export const deleteFromCloudinary = async(public_id) => {
  try {
    if(!public_id) 
    return "public_id of assert isn't available";

    const response = await cloudinary.uploader.destroy(public_id) 
    return response; 
  } catch (error) {
    return "Failed to delete assert from third party service";
  }
}