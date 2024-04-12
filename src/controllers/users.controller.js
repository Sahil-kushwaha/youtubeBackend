import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import User from '../models/user.models.js'
import { cloudinaryUploadFile,cloudinaryDeletFile } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import { extractPublicId } from 'cloudinary-build-url'
import Video from "../models/video.models.js";

const generateAccessAndRefereshTokens = async (userId) => {
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      user.save({ validateBeforeSave: false })

      return { accessToken, refreshToken };

   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating access Token")
   }
}
const registerUser = asyncHandler(async (req, res, next) => {
   //get user details from frontend(form body) 
   // validation- details should not empty
   // check if user already exists: by username ,email
   // check for image ,check for avatar :cloudinary
   //create user object - create entry in db
   // remove password and refresh token field from response 
   // check for user creation
   // return res

   const { username, email, fullName, password } = req.body

   // if(fullName==""){
   //    throw new ApiError(400,"fullName is required")
   // }
   if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
   }

   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   })

   if (existedUser) {
      throw new ApiError(409, "User with email or username already exists")
   }

   //   const avatarLocalPath=req.files?.avatar[0]?.path
   //   const coverImageLocalPath=req.files?.coverImage[0]?.path
   let avatarLocalPath;
   if (req.files && req.files.avatar) {
      avatarLocalPath = req.files.avatar[0]?.path
   }

   let coverImageLocalPath;
   if (req.files && req.files.coverImage) {
      coverImageLocalPath = req.files.coverImage[0]?.path
   }


   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required")
   }

   const avatarResponse = await cloudinaryUploadFile(avatarLocalPath)
   const coverImageResponse = await cloudinaryUploadFile(coverImageLocalPath)

   if (!avatarResponse) {
      throw new ApiError(400, "Avatar file is required")
   }

   const user = await User.create({
      fullName,
      avatar: avatarResponse.url,
      coverImage: coverImageResponse?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while regisetring usr")
   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered Successfully")
   )

})

const loginUser = asyncHandler(async (req, res) => {
   // get details from req body
   // validate details
   // authenticaton by using username or email
   // find the user in db
   // password check
   //access and refresh token 
   //send access and refresh token as secure cookie

   const { email, username, password } = req.body
   console.log(req.body)
   if (!username && !email) {
      throw new ApiError(400, "username or email is required")
   }

   const user = await User.findOne({ $or: [{ username }, { email }] })

   if (!user) {
      throw new ApiError(400, "User does not exit")
   }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials")
   }

   const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

   const loggedInUser = await User.findById(user._id)
      .select("-password -refreshToken")

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser,
               accessToken,
               refreshToken
            },
            "User logged In Successfully"
         )
      )
})

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: { refreshToken: undefined }
      },
      {
         new: true
      })

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
         new ApiResponse(
            200,
            {},
            "User logged Out"
         )
      )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
   try {
      const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

      if (!incomingRefreshToken) {
         throw new ApiError(401, "Unathorised Request")
      }
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET)

      const user = await User.findById(decodedToken._id)

      if (!user) {
         throw new ApiError(401, "Invalid Refresh Token")
      }

      if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, " refresh token is expired or used ")
      }

      const options = {
         httpOnly: true,
         secure: true
      }

      const { newRefreshToken, accessToken } = await generateAccessAndRefereshTokens(user._id)

      return res
         .status(200)
         .setCookie("accessToken", accessToken, options)
         .setCookie("refreshToken", newRefreshToken, options)
         .json(
            new ApiResponse(
               200,
               {
                  accessToken: accessToken,
                  refreshToken: newRefreshToken
               },
               "Access Token Refreshed",
            )
         )
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid Refresh Token")
   }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {

   const { oldPassword, newPassword } = req.body
   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password")
   }

   user.password = newPassword;
   await user.save({ validateBeforeSave: false })

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {

   return res
      .status(200)
      .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {

   const { fullName, email } = req.body

   if (!fullName || !email) {
      throw new ApiError(400, "All fields are required")
   }

   const user = User.findByIdAndUpdate(req.user?._id,
      {
         $set:
         {
            fullName: fullName,
            email: email
         }
      },
      {
         new: true
      }).select("-password -refreshToken")

   return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details "))

})

const updateUserAvatar = asyncHandler(async (req, res) => {

   const avatarLocalPath = req.file?.path
   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing")
   }
   const cloudinaryPath = await cloudinaryUploadFile(avatarLocalPath);

   if (!cloudinaryPath.url) {
      throw new ApiError(400, "Error while uploading on avatar")
   }

   const oldAvatarUrl = await User.findById(req.user?._id).select("avatar")
   const publicId = extractPublicId(oldAvatarUrl)

  const user= await User.findByIdAndUpdate(req.user?._id,
      {
         $set: { avatar: cloudinaryPath.url }
      },
      { new: true }).select("-password")

   //delete old image   
   await cloudinaryDeletFile(publicId)

   return res
      .status(200)
      .json(200, user, "cover image updated successfully")


})

const updateUserCoverImage = asyncHandler(async (req, res) => {

   const coverImageLocalPath = req.file?.path
   if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is missing")
   }
   const cloudinaryPath = await cloudinaryUploadFile(coverImageLocalPath);

   if (!cloudinaryPath.url) {
      throw new ApiError(400, "Error while uploading on cover Image")
   }

   const oldCoverImageUrl = await User.findById(req.user?._id).select("coverImage")
   const publicId = extractPublicId(oldCoverImageUrl)

   const user = await User.findByIdAndUpdate(req.user?._id,
      {
         $set: { coverImage: cloudinaryPath.url }
      },
      { new: true }).select("-password")

   //delete old image   
   await cloudinaryDeletFile(publicId)

   return res
      .status(200)
      .json(200, user, "cover image updated successfully")

})

const getUserChannelProfile= asyncHandler(async(req,res)=>{
         
      const {username}=req.params

      if(username?.trim()){
            throw new ApiError(400, "username is missing")
      }

    const channel = await User.aggregate([
      {
         $match:{
              username:username?.toLowerCase()
         }
      },
      { // user ko kisne subscribe kiya hai (subscriber)
         $lookup:{
              from:"subscriptions",
              localField:"_id",
              foreignField:"channel",
              as : "subscribers"
           }
      },
      { // user ne kis kis ko subscribe kiya hai 
         $lookup:{
             from: "subscriptions",
             localField:"_id",
             foreignField: "subscriber",
             as: "subscribedTo"
         }
      },
      {
          $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                      $cond: {
                              if:{$in:[req.user?._id ,"$subscribers.subscriber"]} ,
                              then: true,
                              else: false,
                           }
                 }
          }
      },
      {
         $project:{
             fullName: 1,
             username: 1,
             subscribersCount:1,
             channelsSubscribedToCount:1,
             isSubscribed:1,
             avatar:1,
             coverImage:1,
             email:1
         }
      }
    ])
   
    if(!channel?.length){
           throw new ApiError(400,"channel does not exists")
    }
    
    return res
     .status(200)
     .json(new ApiResponse(200,channel[0],"user details fetch successfully"))
})



export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile
}