import mongoose, { isValidObjectId } from "mongoose"
import Comment from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    try {
          if(!isValidObjectId(videoId)){
                 throw new ApiError(400 , "invalid videoId")
          }

        const commentAggregate =  Comment.aggregate([
             {
                $match:{
                      video:new mongoose.Types.ObjectId(videoId) 
                }
             },
             {
                  $lookup:{
                      from: "users",
                      localField:"owner",
                      foreignField:"_id",
                      as:"owner",
                      pipeline:[
                        {
                           $project:{
                                 _id:0,
                                 fullName:1,
                                 username:1
                           }
                        }
                      ]
                  }
             },
              {
                 $addFields:{
                     owner:{
                          $first: "$owner"
                     }
                 }
              },
        ])

        if((await commentAggregate).length===0){
           throw new ApiError(200 ,"theres is No comment for this video")
        }

        const options = {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        };
        
    
        const comments = await Comment.aggregatePaginate(commentAggregate, options);
        
        return res
           .status(200)
           .json(new ApiResponse(200, comments ,"all comment fetched successfully"))

    } 
    catch (error) {
        return res
         .status(error.statusCode || 500)
         .json(new ApiError(error.statusCode || 500 , error.message || "internal server error`"))
    }
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    try {
        const {videoId}=req.params
        const {comment} = req.body;
        const user= req.user?._id;
        if (!isValidObjectId(videoId)) {

            throw new ApiError(400, "invalid video id");
        }
        if(!comment.trim()){
            
            throw new ApiError(400, "field required");
        }
        const commentRecord = await Comment.create({
                 content: comment,
                 video: videoId,
                 owner: user
        })   
       
        return res
           .status(200)
           .json(new ApiResponse(200, commentRecord.content ,"new comment add successfully"))

    } catch (error) {
         return res
          .status(error.statusCode || 500)
          .json(new ApiError(error.statusCode || 500 , error.message || "internal server error`"))
    }


})

const updateComment = asyncHandler(async (req, res) => {
  
    try {
      const {commentId} =req.params
      const {comment} =req.body
      if (!isValidObjectId(commentId)) {

        throw new ApiError(400, "invalid video id");
      }
     if(!comment.trim()){
        
        throw new ApiError(400, "field required");
      }
    
        const updatedComment=await Comment.findByIdAndUpdate(
            commentId,
            {
                $set:{content:comment}
            },
           { new :true}                                                 
        )
      return res 
        .status(200)
        .json(new ApiResponse(200 , updatedComment , "comment updated successfully"))

  }
  catch (error) {
      return res
        .status(error.statusCode || 500)
        .json(new ApiError(error.statusCode || 500 , error.message || "internal server error`"))
  }

})

const deleteComment = asyncHandler(async (req, res) => {
      
    try{
         const {commentId} = req.params
         const deletedComment  = await Comment.findByIdAndDelete(commentId)
         console.log(deletedComment)
         return res
           .status(200)
           .json(new ApiResponse(200 , deletedComment.content , "comment deleted successfully"))
    }
    catch(error){
        return res
          .status(error.statusCode || 500)
          .json(new ApiError(error.statusCode || 500 , error.message ||  "internal server error"))
    }

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }