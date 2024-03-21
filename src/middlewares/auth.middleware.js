import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import User from "../models/user.models.js"
export const verifyJWT = asyncHandler(async (req, _ , next) => {
     try {
          const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ", "")

          if (!token) {
               throw new ApiError(401, "Unauthorised request")
          }
     
          const decodedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
          console.log(decodedToken)
          const user = await User.findById(decodedToken?._id)
               .select("-password -refreshToken")
               
          if (!user) {
               //Next video about frontEnd
               throw new ApiError(401, "Invalid Token")
          }
          req.user = user;
          next()
     }
     catch (error) {
          throw new ApiError(error?.message || "invalid access token")
     }
})

