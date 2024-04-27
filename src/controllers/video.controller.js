import mongoose, { isValidObjectId } from "mongoose"
import Video from "../models/video.models.js"
import Like from "../models/like.models.js"
import Comment from "../models/comment.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { cloudinaryUploadFile, cloudinaryDeletFile ,cloudinaryDeleteManyFile} from "../utils/cloudinary.js"
import { extractPublicId } from 'cloudinary-build-url'


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

   try {
     if (!title || !description) {
         throw new ApiError(400, "All fields are required")
     }
 
     let videoLocalPath
     let thumbnailLocalPath
     if (req.files && req.files.videoFile) {
 
         videoLocalPath = req.files.videoFile[0].path
 
     }
     else {
         throw new ApiError(400, "video file is required")
     }
 
     if (req.files && req.files.thumbnail) {
 
         thumbnailLocalPath = req.files.thumbnail[0].path
     }
     else {
         throw new ApiError(400, "thumbnail file is required")
     }
 
 
     const cloudinaryVideoPath = await cloudinaryUploadFile(videoLocalPath);
     const cloudinaryThumbnailPath = await cloudinaryUploadFile(thumbnailLocalPath);
     
     if (!cloudinaryVideoPath || !cloudinaryThumbnailPath) {
 
         throw new ApiError(500, "server not respond")
     }
 
     const video = await Video.create({
         title,
         description,
         videoFile: cloudinaryVideoPath.url,
         thumbnail: cloudinaryThumbnailPath.url,
         duration: cloudinaryVideoPath.duration,
         owner: req.user._id,
         isPublished:true,
         view:0
 
     })
 
     return res
         .status(200)
         .json(new ApiResponse(200, video, "Video file uploaded successfully"))
   } 
   catch (error) {
    return res
    .status(error.statusCode || 500)
    .json(new ApiError(error.statusCode || 500,error.message || "server not responed"))
   }
})


const getAllVideos = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    try{

    const pipeline = [];

    // for using Full Text based search u need to create a search index in mongoDB atlas
    // you can include field mapppings in search index eg.title, description, as well
    // Field mappings specify which fields within your documents should be indexed for text search.
    // this helps in seraching only in title, desc providing faster search results
    // here the name of search index is 'search-videos'

 if (query) {
   
    pipeline.push({
        $search: {
            index: "search-videos",
            text: {
                query: query,
                path: ["title", "description"] // serach only in title and description
            }
        }
    });
}
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // fetch videos only that are set isPublished as true
    pipeline.push({ $match: { isPublished: true } });

    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    //(syntax):- [sortBy]: sortType === "asc" ? 1 : -1  computed property name feature to compute property name of object dynamically by variable
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            _id:0,
                            username: 1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                 ownerDetails:{
                    $first:"$ownerDetails"
                 }
            }
        }
    )
  // here don't use await keyword because pagiantion library not work properly
    const videoAggregate =  Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    
    const video = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched successfully"));
       
} 
    catch (error) {
        console.error(error)
        return res
          .status(error.statusCode || 500)
          .json(new ApiError(error.statusCode || 500,error.message || "server not responed"))
      }
 
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

   try {
       const video = await Video.aggregate([
         {
             $match: {
                 _id: new mongoose.Types.ObjectId(videoId)
             },
         },
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
         {
             $addFields: {
                 owner: {
                     $first: "$owner"
                 }
             }
         }
     ])
 
     if (!video[0]) {
         throw new ApiError(400, "requested video is not available")
     }
 
     return res
         .status(200)
         .json(new ApiResponse(200, video[0], "video fetched successfully"))
   } 
   catch (error) {
        console.error(error);
        return res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500, error.message || "server not responed"))   
    
   }
}
)

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "fields are required")
       }

    const thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail is required")
      }


    try {
        const oldThumbnailPath = await Video.findById(videoId).select("thumbnail owner");
        const publicId = extractPublicId(oldThumbnailPath?.thumbnail)

        if (oldThumbnailPath?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(
                400,
                "You can't edit this video as you are not the owner"
            );
        }

        if(!oldThumbnailPath) {
            throw new ApiError(400, "video not found")
          }
        
        const thumbnailCloudinaryPath = await cloudinaryUploadFile(thumbnailLocalPath);

        const updatedVidoeInfo = await Video.findByIdAndUpdate(
            videoId,
            {
                title,
                description,
                thumbnail: thumbnailCloudinaryPath.url
            },
            {
                new: true
            }
        ).select("title description thumbnail")

        if (!updatedVidoeInfo) {
            throw new ApiError(500, "Server not responed")
        }

        //delete old vidoe from cloudinary
        const flag =await cloudinaryDeletFile(publicId)    
        if(flag){
            console.log("old file deleted successfully")
        }

        return res
            .status(200)
            .json(new ApiResponse(200, updatedVidoeInfo, "Video info updated successfully"))

    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(error.statusCode || 500).json(new ApiError(error.statusCode || 500,error.message || "server not responed"))
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    
 try{

        const { videoId } = req.params

        if(!isValidObjectId(videoId))
        {
            throw new ApiError(400, "invalid video id")
        }
        
        const video = await Video.findById(videoId).select("thumbnail videoFile owner");
        console.log(video)
        if(!video){
            throw new ApiError(404, "video not found")
        }

        const thumbnail = video?.thumbnail
        const videoFile = video?.videoFile

        if(!thumbnail || !videoFile) {
            throw new ApiError(404, "video not found")
          }

        const publicIdOfThumbnail = extractPublicId(thumbnail)
        const publicIdOfVideo = extractPublicId(videoFile)

        if (video?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(
                400,
                "You can't delete this video as you are not the owner"
            );
        }
       
        await Video.deleteOne({_id:videoId});
          
         await cloudinaryDeletFile(publicIdOfThumbnail)
         
         // pass array of public id with type but of same type
         await cloudinaryDeleteManyFile([publicIdOfVideo],"video")

          // delete video likes
         await Like.deleteMany({
              video: videoId
          })

         // delete video comments
         await Comment.deleteMany({
           video: videoId,
         })

        return res
         .status(200 )
         .json(new ApiResponse(200,null,"Video deleted successfully"))
    }
    catch(error){
        console.error(error)
        return res
        .status(error.statusCode || 500 )
        .json(new ApiError( error.statusCode || 500 ,error.message || "server not responed"))
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    try {
        const video= await Video.findById(videoId)

        if(!video){
            throw new ApiError(400,"Vidoe not found")
        }

        if (video?.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(
                400,
                "You can't toogle publish status as you are not the owner"
            );
        }

        video.isPublished=!video.isPublished
        await video.save();

        return res
        .status(200)
        .json(new ApiResponse(200,{isPublished:video.isPublished},"toggled"))
    }  
    catch(error){
        console.error(error)
        return res
        .status(error.statusCode || 500 )
        .json(new ApiError( error.statusCode || 500 ,error.message || "server not responed"))
    }

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}