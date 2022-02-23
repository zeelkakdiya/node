const jwt  = require("jsonwebtoken")

const Register = require("../models/register")

const auth = async(req,res,next) =>{
    
    try{
        const token = req.cookies.jwt
        const verifyuser = jwt.verify(token,process.env.SECRET_KEY)
        console.log(verifyuser)
    
        const user = await Register.findOne({_id:verifyuser._id})
        console.log(user)

        req.token = token,
        req.user = token

         next();
    }catch(er){
       res.status(404).send(er)   
    }

     
}

module.exports = auth