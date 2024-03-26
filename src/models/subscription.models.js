import mongoose, {Schema} from 'mongoose'

const subscriptionSchema=new Schema({
            subcriber:{
                type: Schema.Types.ObjectId, // one who is subsribing
                ref:"User"
            },
            
            channel: {
                 type: Schema.Types.ObjectId, // one to whom subscriber is subscribing
                 ref : "User"
            }
},{timestamps:true})

const Subscription=mongoose.model('Subscription',subscriptionSchema)

export default Subscription;