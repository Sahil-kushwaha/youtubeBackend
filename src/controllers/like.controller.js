import mongoose, { isValidObjectId } from "mongoose"
import Like from "../models/like.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const user = req.user?._id;
    try {
        if (!isValidObjectId(videoId)) {

            throw new ApiError(400, "invalid video id");
        }
        // add videoId which is being liked by a user
        // add userId who liked that video
        const isAlreadyLiked = await Like.exists({
            video: videoId,
            likedBy: user
        })

        if (isAlreadyLiked) {

            await Like.findOneAndDelete({
                video: videoId,
                likedBy: user
            })

            return res
                .status(200)
                .json(new ApiResponse(
                    200, 
                    {
                    video: videoId,
                    likedBy: user,
                    isLiked : false,
                    },
                   "like toggled successfully"
                ))
        }

       const likeToggle= await Like.create({
            video: videoId,
            likedBy: user

            })

        return res
            .status(200)
            .json(new ApiResponse(200, {...likeToggle._doc,isLiked:true}, "like toggled successfully"))

    }
    catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(new ApiError(error.statusCode || 500, error.message || "internal server error"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    
    const user = req.user?._id;
    try {
        if (!isValidObjectId(commentId)) {

            throw new ApiError(400, "invalid comment id");
        }

    const isCommentLiked=await Like.exists({
          comment:commentId,
          likedBy: user
    })

    if(isCommentLiked){
          await Like.findOneAndDelete({
              comment:commentId,
              likedBy: user
          })

          return res
                .status(200)
                .json(new ApiResponse(
                    200, 
                    {
                     comment: commentId,
                    likedBy: user,
                    isLiked : false,
                    },
                   "like toggled successfully"
                ))  
    }
    
    
    const likeToggle= await Like.create({
        comment: commentId,
        likedBy: user

        })

    return res
        .status(200)
        .json(new ApiResponse(200, {...likeToggle._doc,isLiked:true}, "like toggled successfully"))


  }

  catch (error) {
    return res
        .status(error.statusCode || 500)
        .json(new ApiError(error.statusCode || 500,  error.message || "internal server error"))
   }
   
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    
    const user = req.user?._id;
    try {
        if (!isValidObjectId(tweetId)) {

            throw new ApiError(400, "invalid tweet id");
        }

    const isTweetLiked=await Like.exists({
          tweet:tweetId,
          likedBy: user
    })

    if(isTweetLiked){
          await Like.findOneAndDelete({
            tweet:tweetId,
            likedBy: user
          })

          return res
                .status(200)
                .json(new ApiResponse(
                    200, 
                    {
                    tweet:tweetId,
                    likedBy: user,
                    isLiked : false,
                    },
                   "like toggled successfully"
                ))  
    }
    
    
    const likeToggle= await Like.create({
        tweet:tweetId,
        likedBy: user

        })

    return res
        .status(200)
        .json(new ApiResponse(200, {...likeToggle._doc,isLiked:true}, "like toggled successfully"))


  }

  catch (error) {
    return res
        .status(error.statusCode || 500)
        .json(new ApiError(error.statusCode || 500,  error.message || "internal server error"))
   }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
      
    const user = req.user?._id

  try {
      const getAllVideo= await Like.aggregate([
                {
                  $match:{
                      video:{$exists: true},
                      likedBy:new mongoose.Types.ObjectId(user)
                  }
                },
                {
                    $lookup: {
                        from: "videos",
                        localField: "video",
                        foreignField: "_id",
                        as: "video",
                        pipeline: [
                            {
                                  $lookup: {
                                        from: "users",
                                        localField: "owner",
                                        foreignField: "_id",
                                        as: "owner",
                                        pipeline: [
                                            {
                                                $project: {
                                                    fullName: 1,
                                                    username: 1
                                                }
                                            },
                        
                                        ]
                                    }
                                
                            },
        
                        ]
                    }
                },
                {
                    $addFields: {
                        video: {
                            $first: "$video"
                        }
                    }
                }
      ])
     
      if(getAllVideo.length===0){
             throw new ApiError(200 ,"User do not liked any video")
      }

      return res
        .status(200)
        .json(new ApiResponse(200 ,getAllVideo,"All liked vidoe fetched successfully"))
  } 
  catch (error) {
         return res
             .status(error.statusCode || 500)
             .json(new ApiError(error.statusCode || 500, error.message || "internal server error"))
            
  }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}