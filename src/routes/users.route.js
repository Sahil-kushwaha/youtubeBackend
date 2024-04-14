import express from "express";
import { registerUser,
         loginUser,
         logoutUser ,
         refreshAccessToken, 
         changeCurrentPassword,
         getCurrentUser,
         updateAccountDetails,
         updateUserAvatar,
         updateUserCoverImage,
         getUserChannelProfile,
         watchHistory
        } from "../controllers/users.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userRouter=express.Router()

 
userRouter.route('/register').post(
    upload.fields([
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount: 1
        }
    ]),
    registerUser)

userRouter.route("/login").post(loginUser)    

// secured routes
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/change-password").patch(verifyJWT,changeCurrentPassword)
userRouter.route("/get-user").get(verifyJWT,getCurrentUser)
userRouter.route("/update-account-details").patch(verifyJWT,updateAccountDetails)
userRouter.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
userRouter.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
userRouter.route("/get-user-channel-profile").get(verifyJWT,getUserChannelProfile)
userRouter.route("/watch-history").get(verifyJWT,watchHistory)


export default userRouter;