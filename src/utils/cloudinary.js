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
                      fs.unlinkSync(localFilePath);
                      return response;
                }   
                
               catch(error){
                    //remove the locally saved temprory file as the upload operartion got failed
                    fs.unlinkSync(localFilePath) 
                    console.log("couldinary service::Error: ",error)
                    return null;
               } 
}

const cloudinaryDeletFile=async (publicId)=>{
                try{
                       if(!publicId) return null;
                      //delete file on cloudinary
                      const response=await cloudinary.uploader.destroy(publicId)        
                     // file has been deleted successfully
                      // console.log(response)
                      return response;
                }   
                
               catch(error){
                    console,log("couldinary service::Error:",error.message)
                    return null;
               } 
}

// pass array of public id but of same type
const cloudinaryDeleteManyFile=async (publicIds,type)=>{
                try{
                       if(!publicIds) return null;
                      //delete file on cloudinary
                      const response=await cloudinary.api
                      .delete_resources(
                         publicIds, 
                         { 
                              type: 'upload', resource_type: type ? type : "image" 
                         }
                       )

                      return response;
                }   
                
               catch(error){
                    console.log("couldinary service::Error:",error.message)
                    return null;
               } 
}

export {cloudinaryUploadFile,cloudinaryDeletFile,cloudinaryDeleteManyFile}

