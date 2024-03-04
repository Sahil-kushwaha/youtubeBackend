// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import {app} from './app.js'

dotenv.config({
    path:'./env'
})

/*
;( async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) 
        app.on("error",(error)=>{
            console.log('ERRr',error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening at ${process.env.PORT}`)
        })
    } catch(error){
         console.error("ERROR:",error);
    }
}

)() */

connectDB()
.then(()=>{
   app.listen(process.env.PORT || 8080,()=>{
    console.log(`Server is start at ${process.env.PORT || 8080}`)
   })
})
.catch((error)=>{
      console.log("MONGO db connection failed !!!",err) 
})
