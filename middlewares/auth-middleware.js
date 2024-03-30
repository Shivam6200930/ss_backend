import jwt from 'jsonwebtoken'
import {user} from '../models/user.js'
let checkUserAuth=async(req,res,next)=>{
    const cook=(req.cookies && req.cookies.shivam) || null
    if(!cook){
      return res.status(400).json({message: 'you have not a cookies'})
    }
      try{
            const{userID}=jwt.verify(cook , process.env.jwt_secret_key)
            req.user= await user.findById(userID).select(`-password`)
            next();
      }catch(err){
       res.status(400).json({message:"Unauthorized User"})
      }
}

export default checkUserAuth