import jwt from "jsonwebtoken";

export const jwtAuthMiddleware=(req,res,next)=>{
    //First check request headers has authorization or not

    const authorization=req.headers.authorization
    if(!authorization) return res.status(401).json({error:'Token not found'});

    //Extract jwt token from request headers

    const token=req.headers.authorization.split(' ')[1];
    
    if(!token) return res.status(401).json({error:'Unauthorized'});
    try {
        //Verify jwt token
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        //Attach user info to request object
        req.user=decoded
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({error:'Invalid token'});
    }
}

//Function to generate token
export const generateToken=(userData)=>{
    //Generate jwt token using userData
    return jwt.sign(userData,process.env.JWT_SECRET);
}
