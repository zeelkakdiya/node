require("./db/conn")
const sendmail = require("./sendmail/sendmail")
const Useradd = require("./models/useraddress")
const Product = require("./models/product")
require('dotenv').config();
const Register = require("./models/register")
const Contactaus = require("./models/contactaus")
const express = require("express")
const port = process.env.PORT || 5000;
const app = express();
const bcrypt = require("bcryptjs")
const jwt  = require("jsonwebtoken");
const cors = require("cors");
const useradd = require("./models/useraddress");
const multer = require('multer');


const storages = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,'./uploads/');
    },
    filename: function(req,file,cb){
        cb(null,new Date().toString() + file.originalname);
    }
});

const filefilter = (req,file,cb) =>{
   if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype == 'image/jpg'){
       cb(null,true);
   }
   else{
       cb(null,false);
   }
}

const upload = multer(
    {
        storage:storages ,
        limits:{
        fileSize:1024*1024*5
},
fileFilter:filefilter
})

app.use(express.json());
app.use(express.urlencoded({extended:false}))
app.use(cors());
app.use('/uploads' ,express.static('uploads'));

app.get("/" ,(req,res) =>{
    res.send("register login")
})


app.post("/register" , async(req,res) =>{
    try{
        const password = req.body.password;
        const confirmpassword = req.body.confirmpassword
        const username  = req.body.username;
         const email = req.body.email;

        if(password === confirmpassword ){
            const userregister = new Register({
                username : username,
                email : email,
                password :password,
                confirmpassword:  confirmpassword
            })
            
         
                console.log("the sucess the part of " + userregister)
                const token = await userregister.genratetoken();
                console.log("the part of token " + token)
                
                const sendemail = await sendmail.send_mail(username,email).then((result)=>console.log(result)).catch((err)=> console.log(err))
                console.log(`The part of the send email ${sendemail}`)
                

            const regi = await userregister.save();
            res.status(201).send(regi)
        }
      else{
        res.status(401).send("password Not metch")
      }
    }catch(er){
        console.log(er)
       res.status(500).send(er)
    }

})

app.get("/register",async(req,res) =>{
    try{
        const getregister = await Register.find()
        res.send(getregister)
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }

})

app.get("/login" , async(req,res) =>{
    try{
        const getlogindata = Register.find({})
        res.status(201).send(getlogindata)
    }catch(err){
        console.log(`server error${err}`)
          res.status(500).send(err)
    }

})

app.post("/login" ,async (req,res)=>{   

    try{
        const email = req.body.email;
        const password = req.body.password;
       

         const userlogin = await Register.findOne({email:email})
 
         const isMatch = await bcrypt.compare(password,userlogin.password)

         
        
         const token = await userlogin.genratetoken();
         console.log("the part of token " + token)

         const sendemail = await sendmail.send_mail(email,email).then((result)=>console.log(result)).catch((err)=> console.log(err))
         console.log(`The part of the send email ${sendemail}`)

         if(isMatch){
            res.status(201).send(userlogin)
         }
         else{
             res.send("password not match")
         }

         
    }catch(err){
        console.log(err)
     res.status(500).send(err)
    }
    
})

app.put("/forgotpass/:id" , async (req,res) =>{

    try{
        const _id  = req.params.id
        const forgotpassword = await Register.findByIdAndUpdate(_id,req.body.password,{
            new: true,
        })
        if(!_id){
            res.status(401).send()
        }
        res.status(201).send(forgotpassword)
    }catch(err){
       rest.status(501).send(err)
    }
    
})

app.patch("/changepassword/:id" , async (req,res,next)=>{
        console.log('changepassword')
        try{

            const {id} = req.params;
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(req.body.password,salt)
            const userpassword = await Register.findByIdAndUpdate({_id : id} ,{password:password},{new:true})
            const token = await userpassword.genratetoken();
            console.log("the part of token " + token)
            return res.status(201).json({status:true , data :userpassword })
    

        }catch(err){
            console.log(err)
            res.status(501).json({status:false , err : "Error Occured"})
        }
}) 

app.post("/contactaus"  ,async (req,res) =>{
   
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const subject = req.body.subject;
    const messgae =  req.body.messgae

      try{
        const user = new Contactaus({
            firstname:firstname,
            lastname:lastname,
            email:email,
            subject:subject,
            messgae:messgae
        })
        const contact = await user.save();
        
        if(!user){
            res.status(401).send();
        }
        res.status(201).send(contact)

      }catch(err){
        console.log(err)
        res.status(501).send(err)
      }
    
 })

 app.get("/contactaus" , async(req,res) =>{
     try{
        const getcondata = await Contactaus.find({});
       
        
       if(!getcondata){
           res.status(401).send();
       }
       res.status(201).send(getcondata)

     }catch(err){
         console.log(err)
         res.status(501).send(err)
     }

 })

 app.post("/useraddress" , async (req,res) =>{
     
  const userid = req.body.userid;
  const address =req.body.address;
  const city = req.body.city;
  const pincode = req.body.pincode;
  const country = req.body.country;
  const phoneno = req.body.phoneno;

    try{

         const useraddress = new Useradd({
               userid : userid,
               address : address,
               city:city,
               pincode :pincode,
               country:country,
               phoneno:phoneno
         })

        const useadd = await useraddress.save();
        
        if(!useadd){
            res.status(401).send();
        }

        res.status(201).send(useadd)
         
    }catch(err){
       console.log(err)
       res.status(401).send(err)
    }
     
 })

 app.get("/useraddress" , async (req,res) =>{
     try{
        const usergedata = await useradd.find({})
        .populate("userid","_id")
        res.status(201).send(usergedata)
     }catch(err){
         console.log(err)
        res.status(501).send(err)
     }

 })

 app.post("/product" ,upload.single('productImage'), async (req,res)=>{
console.log(req.file);
    try{
        const name = req.body.name;
        const price = req.body.price;
        const manufactureddate = req.body.manufactureddate;
        const importdate = req.body.importdate;
        const expiredate = req.body.expiredate;
        const productImage = req.file.path;
        const details = req.body.details;
    
        const products = new Product({
            name:name,
            price:price,
            manufactureddate:manufactureddate,
            importdate:importdate,
            expiredate:expiredate,
            productImage:productImage,
            details:details
        })
    
        const pro = await products.save();

        if(!pro){
            res.status(401).send();
        }
        res.status(201).send(pro)

    }catch(err){
        console.log(err)
        res.status(501).send(err)
    }
    


    
 })

app.listen(port ,()=>{
    console.log(`port number ${port}`)
})