import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryUploadFile=async (localFilePath)=>{
                try{
                       if(!localFilePath) return null;
                      //upload file on cloudinary
                      const response=await cloudinary.uploader.upload(localFilePath,
                      {
                         resource_type:"auto" 
                      })        
                     // file has been uploaded successfully
                      // console.log(response.url)
                      fs.unlinkSync(localFilePath);
                      return response;
                }   
                
               catch(error){
                    //remove the locally saved temprory file as the upload operartion got failed
                    fs.unlinkSync(localFilePath) 
                    return null;
               } 
}

const cloudinaryDeletFile=async (publicId,option)=>{
                try{
                       if(!publicId) return null;
                      //delete file on cloudinary
                      const response=await cloudinary.uploader.destroy(publicId,option)        
                     // file has been deleted successfully
                      // console.log(response)
                      return response;
                }   
                
               catch(error){
            
                    return null;
               } 
}

export {cloudinaryUploadFile,cloudinaryDeletFile}