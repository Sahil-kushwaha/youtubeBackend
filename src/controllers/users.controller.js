import {asyncHandler} from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import User from '../models/user.models.js'
import {cloudinaryUploadFile} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
const registerUser=asyncHandler(async(req,res,next)=>{
   //get user details from frontend(form body) 
   // validation- details should not empty
   // check if user already exists: by username ,email
   // check for image ,check for avatar :cloudinary
   //create user object - create entry in db
   // remove password and refresh token field from response 
   // check for user creation
   // return res
    
const {username,email,fullName,password}= req.body

// if(fullName==""){
//    throw new ApiError(400,"fullName is required")
// }
if([fullName,username,email,password].some((field)=>field?.trim()==="")){
   throw new ApiError(400,"All fields are required");
}

 const existedUser=await User.findOne({
   $or:[{username},{email}]
  }) 

  if(existedUser){
      throw new ApiError(409,"User with email or username already exists")
  }

//   const avatarLocalPath=req.files?.avatar[0]?.path
//   const coverImageLocalPath=req.files?.coverImage[0]?.path
  let avatarLocalPath;
  if(req.files && req.files.avatar){
     avatarLocalPath=req.files.avatar[0]?.path
   }

  let coverImageLocalPath;
  if(req.files && req.files.coverImage){
     coverImageLocalPath=req.files.coverImage[0]?.path
   }
     

  if(!avatarLocalPath){
       throw new ApiError(400,"Avatar file is required")
  }
  
  const avatarResponse =await cloudinaryUploadFile(avatarLocalPath)
  const coverImageResponse =await cloudinaryUploadFile(coverImageLocalPath)

  if(!avatarResponse){
    throw new ApiError(400,"Avatar file is required")
  }

const user =await User.create({
       fullName,
       avatar:avatarResponse.url,
       coverImage:coverImageResponse?.url || "",
       email,
       password,
       username:username.toLowerCase()
 })

 const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
 )

 if(!createdUser){
    throw new ApiError(500, "Something went wrong while regisetring usr")
 }

 return res.status(201).json(
     new ApiResponse(200,createdUser,"User registered Successfully")
 )

})

export {registerUser}