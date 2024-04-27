import mongoose ,{Schema} from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema= new Schema({
             videoFile:{
                type: String ,// cloudnary url    
                required:true,           
            },
            thumbnail:{
                type: String, // cloudnary url
                required:true
            },
            title:{
                type:String, 
                required:true 
            },
            description:{
                 type:String,
                 required:true
            },
            duration:{
                 type:Number,
                 required:true
            },
            views:{
                type:Number,
                default:0
            },
            isPublished:{
                type:Boolean,
                default:true
            },
            owner:{
                type:Schema.Types.ObjectId,
                ref:"User",
        
            }
},{timestamps:true})

// // Create a compound text index for both title and description
// videoSchema.index({ title: 'text', description: 'text' }, { name: 'search-videos' });

videoSchema.plugin(mongooseAggregatePaginate)

const Video=mongoose.model("Video",videoSchema);

export default Video;