import mongoose, { isValidObjectId } from "mongoose"
import Tweet from "../models/tweet.models.js"
import User from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
      
        try {    
                const user = req.user?._id
                const {description} = req.body
                if(!description.trim()){
                     throw new ApiError(400 , "field is required")
                }
                const tweet = await Tweet.create({
                         content : description,
                         owner : new mongoose.Types.ObjectId(user)
                })

                 console.log(tweet)
                if(!tweet){
                     
                }
               
            return res
              .status(200)
              .json(new ApiResponse(200 , tweet , "tweet created"))
                             
   
        } catch (error) {
             return res 
                .status(error.statusCode || 500)
                .json(new ApiError(error.statusCode || 500 , error.message || "internal server error"))
        }
})

const getUserTweets = asyncHandler(async (req, res) => {
    try {    
    
        const {userId} = req.params
        const tweet = await Tweet.findOne({owner:userId})

        if(!tweet){
             throw new ApiError(400 , "tweet not found")
        }
       
    return res
      .status(200)
      .json(new ApiResponse(200 , tweet , "tweet fetched successfully"))
                     

} catch (error) {
     return res 
        .status(error.statusCode || 500)
        .json(new ApiError(error.statusCode || 500 , error.message || "internal server error"))
}
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    try {
        const userId = req.user?._id; 
        const { tweetId } = req.params;
        const { updatedTweet } = req.body;
    
        // Find the tweet by ID
        const tweet = await Tweet.findById(tweetId);
    
        if (!tweet) {
            throw new ApiError(400 ,"Tweet not found" )
         }
        // Check if the user is the owner of the tweet
        if (tweet.owner.toString() !== userId) {
            throw new ApiError(400 ,"Unauthorized to modify this tweet" )
        }
    
        // Update the tweet content
        tweet.content = updatedTweet;
        await tweet.save();
    
        return res
        .status(200)
        .json(new ApiResponse(200 ,tweet,"tweet updated successfully"));
      } 
      catch (error) {
        return res
        .status(error.statusCode || 500)
        .json(new ApiError(error.statusCode || 500 ,error.message || "Internal server error"));
      }
})

const deleteTweet = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const { tweetId } = req.params;
    
        // Find the tweet by ID
        const tweet = await Tweet.findById(tweetId);
    
        if (!tweet) {
          throw new ApiError(400 ,"Tweet not found" )
        }
    
        // Check if the user is the owner of the tweet
        if (tweet.owner.toString() !== userId) {
            throw new ApiError(400 ,"Unauthorized to modify this tweet" )
        }
        // delete tweet 
         const flag = await Tweet.findByIdAndDelete(tweetId)
    
        return res
        .status(200)
        .json(new ApiResponse(200 ,{},"tweet deleted successfully"));
      } 
      catch (error) {
         return res
         .status(error.statusCode || 500)
         .json(new ApiError(error.statusCode || 500 ,error.message || "Internal server error"));
      }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}