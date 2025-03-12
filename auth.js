import passport from "passport";
import { Strategy as LocalStrategy } from 'passport-local';
import User from "./models/userModel.js";


passport.use(new LocalStrategy(async(AADHARNUMBER,PASSWORD,done)=>{
    try {
        console.log('Received credentials:',AADHARNUMBER,PASSWORD);
        const user=await User.findOne({aadharnumber:AADHARNUMBER});
        if(!user)
            return done(null,false,{message:'Incorrect aadharnumber'});
        const ispasswordmatch=await user.comparePassword(PASSWORD);
        if(ispasswordmatch){
            return done(null,user);
        }
        else{
            return done(null,false,{message:'Incorrect password'});
        }
    } catch (error) {
        return done(error);
    }
}))

export default passport;

