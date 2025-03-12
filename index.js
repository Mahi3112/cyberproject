import express from "express";
import dotenv from "dotenv";
import bodyparser from "body-parser";
import passport from "./auth.js";
import databaseConnection from "./db.js";
import UserRoute from "./routes/userRoutes.js";


//Connect database
databaseConnection();

dotenv.config({
    path:".env"
})

const app=express();

// body-parser is also a middleware
app.use(bodyparser.json());

//Middleware 
const logRequest=(req,res,next)=>{
    console.log(`${new Date().toLocaleString()} Request made to :${req.originalUrl}`);
    next();
}
app.use(logRequest);

//Authentication
app.use(passport.initialize());
const localAuthMiddleware=passport.authenticate('local',{session:false})

//Use routers
app.use('/user',UserRoute);

app.listen(process.env.PORT,()=>{
    console.log(`Server listen at port ${process.env.PORT}`);
})
