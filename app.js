require("./db/conn")
const sendmail = require("./sendmail/sendmail")
const Useradd = require("./models/useraddress")
const Product = require("./models/product")
const Productinventroy = require("./models/product-inventroy")
const Discount = require("./models/discount")
const Order = require("./models/order")
const Orderitem = require("./models/orderitem")
const Orderdetails = require("./models/orderdetails")
const Customer = require("./models/customer")
const Cartitem = require("./models/cart_item")
const Userpayment = require("./models/userpayment")
const Payment = require("./models/payments")
const Paymentdetails = require("./models/paymentdetails")
const Reviwe = require("./models/reviwe")
const auth = require("./midlware/auth")
require('dotenv').config();
const Register = require("./models/register")
const Contactaus = require("./models/contactaus")
const express = require("express")
const port = process.env.PORT || 5000;
const app = express();
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const cors = require("cors");
const useradd = require("./models/useraddress");
const multer = require('multer');
const path = require('path')
const hash = require('random-hash');
const cookieParser = require("cookie-parser")
const bodyParser = require('body-parser');
const authenticationtoken = require("./midlware/auth")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storages = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, './uploads'));
        // cb(null, __dirname);
    },
    filename: (req, file, callback) => {
        let temp =  file.originalname.split('.');
        const filename = temp[0] + '-' + hash.generateHash({ length: 5 }) + '.' + temp[1]
        callback(null, filename);
    }
});

const filefilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype == 'image/jpg' ) {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
}

const upload = multer(
    {
        storage: storages,
        limits: {
            fileSize: 1024 * 1024 * 5
        },
        fileFilter: filefilter
    })

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cors());
app.use('./uploads/', express.static('uploads'));
// app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.send("register login")
})


app.post("/register", async (req, res) => {
    try {
        const password = req.body.password;
        const confirmpassword = req.body.confirmpassword
        const username = req.body.username;
        const email = req.body.email;

        if (password === confirmpassword) {
            const userregister = new Register({
                username: username,
                email: email,
                password: password,
                confirmpassword: confirmpassword
            })


            console.log("the sucess the part of " + userregister)
            const token = await userregister.genratetoken();
            console.log("the part of token " + token)

            const sendemail = await sendmail.send_mail(username, email).then((result) => console.log(result)).catch((err) => console.log(err))
            console.log(`The part of the send email ${sendemail}`)

            console.log("cookie genrated")
            res.cookie("jwt", token, {
                expires: new Date(Date.now() + 90000),
                httpOnly: true,

            })
            const regi = await userregister.save();
            res.status(201).send(regi)
        }
        else {
            res.status(401).send("password Not metch")
        }
    } catch (er) {
        console.log(er)
        res.status(500).send(er)
    }

})

app.get("/register", async (req, res) => {
    try {
        const getregister = await Register.find()
        res.send(getregister)
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }

})

app.get("/login", async (req, res) => {
    try {
        const getlogindata = Register.find({})
        res.status(201).send(getlogindata)
    } catch (err) {
        console.log(`server error${err}`)
        res.status(500).send(err)
    }

})

app.post("/login", authenticationtoken, async (req, res) => {

    try {
        const email = req.body.email;
        const password = req.body.password;


        const userlogin = await Register.findOne({ email: email })

        const isMatch = await bcrypt.compare(password, userlogin.password)

        const token = await userlogin.genratetoken();
        console.log("the part of token " + token)

        const sendemail = await sendmail.send_mail(email, email).then((result) => console.log(result)).catch((err) => console.log(err))
        console.log(`The part of the send email ${sendemail}`)

        console.log("cookie genrated")
        res.cookie("jwt", token, {
            expires: new Date(Date.now() + 90000),
            httpOnly: true,

        })

        if (isMatch) {
            res.status(201).send(userlogin)
        }
        else {
            res.send("password not match")
        }


    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }

})

app.put("/forgotpass/:id", async (req, res) => {

    try {
        const _id = req.params.id
        const forgotpassword = await Register.findByIdAndUpdate(_id, req.body.password, {
            new: true,
        })
        if (!_id) {
            res.status(401).send()
        }
        res.status(201).send(forgotpassword)
    } catch (err) {
        rest.status(501).send(err)
    }

})

app.patch("/changepassword/:id", async (req, res, next) => {
    console.log('changepassword')
    try {

        const { id } = req.params;
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(req.body.password, salt)
        const userpassword = await Register.findByIdAndUpdate({ _id: id }, { password: password }, { new: true })
        const token = await userpassword.genratetoken();
        console.log("the part of token " + token)
        return res.status(201).json({ status: true, data: userpassword })


    } catch (err) {
        console.log(err)
        res.status(501).json({ status: false, err: "Error Occured" })
    }
})

app.post("/contactaus", async (req, res) => {

    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const subject = req.body.subject;
    const messgae = req.body.messgae

    try {
        const user = new Contactaus({
            firstname: firstname,
            lastname: lastname,
            email: email,
            subject: subject,
            messgae: messgae
        })
        const contact = await user.save();

        if (!user) {
            res.status(401).send();
        }
        res.status(201).send(contact)

    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }

})

app.get("/contactaus", async (req, res) => {
    try {
        const getcondata = await Contactaus.find({});


        if (!getcondata) {
            res.status(401).send();
        }
        res.status(201).send(getcondata)

    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }

})

app.post("/useraddress", async (req, res) => {

    const userid = req.body.userid;
    const address = req.body.address;
    const city = req.body.city;
    const pincode = req.body.pincode;
    const country = req.body.country;
    const phoneno = req.body.phoneno;

    try {

        const useraddress = new Useradd({
            userid: userid,
            address: address,
            city: city,
            pincode: pincode,
            country: country,
            phoneno: phoneno
        })

        const useadd = await useraddress.save();

        if (!useadd) {
            res.status(401).send();
        }

        res.status(201).send(useadd)

    } catch (err) {
        console.log(err)
        res.status(401).send(err)
    }

})

app.get("/useraddress", async (req, res) => {
    try {
        const usergedata = await useradd.find({})
            .populate("userid", "_id")
        res.status(201).send(usergedata)
    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }

})

app.post("/product", upload.single("productImage"), async (req, res) => {
    console.log(req.file);
    try {
        const name = req.body.name;
        const price = req.body.price;
        const manufactureddate = req.body.manufactureddate;
        const importdate = req.body.importdate;
        const expiredate = req.body.expiredate;
        const productImage = req.file.path;
        const details = req.body.details;

        const products = new Product({
            name: name,
            price: price,
            manufactureddate: manufactureddate,
            importdate: importdate,
            expiredate: expiredate,
            productImage: productImage,
            details: details
        })

        const pro = await products.save();

        if (!pro) {
            res.status(401).send();
        }
        res.status(201).send(pro)

    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }




})

app.get("/product", async (req, res) => {
    try {
        const getdataproduct = await Product.find({})
        res.status(201).send(getdataproduct)
    } catch (err) {
        console.log(err)
        res.status(401).send(err);
    }

})

app.post("/Productinventroy", async (req, res) => {

    try {
        const productid = req.body.productid;
        const unit = req.body.unit;
        const price = req.body.price;
        const quntity = req.body.quntity;

        const productinventory = Productinventroy({
            productid: productid,
            unit: unit,
            price: price,
            quntity: quntity
        })

        const productinventorydata = await productinventory.save();
        if (!productinventorydata) {
            res.status(401).send();
        }
        res.status(201).send(productinventorydata)
    } catch (err) {
        console.log(err)
        res.status(401).send(err)
    }



})

app.get("/Productinventroy", async (req, res) => {
    try {
        const getdataproductinventroy = await Productinventroy.find({})
            .populate("productid", "_id name")
        if (!getdataproductinventroy) {
            res.status(401).send();
        }
        res.status(201).send(getdataproductinventroy)
    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }

})

app.post("/Discount", async (req, res) => {
    try {
        const pname = req.body.pname;
        const discount = req.body.discount;
        const archive = req.body.archive;
        const totalprice = req.body.totalprice;

        const dis = new Discount({
            pname: pname,
            discount: discount,
            archive: archive,
            totalprice: totalprice,
        })

        const discounts = await dis.save();
        if (!discounts) {
            res.status(501).send();
        }
        res.status(201).send(discounts)
    } catch (err) {
        console.log(err)
        res.status(500).send();
    }
})

app.get("/Discount", async (req, res) => {
    try {
        const getdatadiscount = await Discount.find()
        res.status(201).send(getdatadiscount);
    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }

})

app.post("/Order", async (req, res) => {
    try {
        const productid = req.body.productid;
        const quntity = req.body.quntity;
        const totalprice = req.body.totalprice;
        const orderdate = req.body.orderdate;
        const paymentdate = req.body.paymentdate;
        const userid = req.body.userid;
        const discount = req.body.discount;
        const comment = req.body.comment;
        const status = req.body.status;

        const orde = new Order({
            productid: productid,
            quntity: quntity,
            totalprice: totalprice,
            orderdate: orderdate,
            paymentdate: paymentdate,
            userid: userid,
            discount: discount,
            comment: comment,
            status: status
        })

        const orders = await orde.save();
        if (!orders) {
            res.status(501).send();
        }
        res.status(201).send(orders)
    } catch (err) {
        console.log(err)
        res.status(500).send();
    }
})

app.get("/Order", async (req, res) => {
    try {
        const getdataorder = await Order.find()
            .populate("productid userid", "_id name")
        res.status(201).send(getdataorder);
    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }

})

app.post("/Orderitem", async (req, res) => {
    try {
        const orderid = req.body.orderid
        const productid = req.body.productid;
        const quntity = req.body.quntity;


        const ordeitem = new Orderitem({
            orderid: orderid,
            productid: productid,
            quntity: quntity,

        })

        const orderitems = await ordeitem.save();
        if (!orderitems) {
            res.status(501).send();
        }
        res.status(201).send(orderitems)
    } catch (err) {
        console.log(err)
        res.status(500).send();
    }
})


app.get("/Orderitem", async (req, res) => {
    try {
        const getdataorderitem = await Orderitem.find()
            .populate("orderid productid", "_id price")
        res.status(201).send(getdataorderitem);
    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }

})

app.post("/Orderdetails", async (req, res) => {
    try {
        const userid = req.body.userid
        const totalpayment = req.body.totalpayment;
        const paymentid = req.body.paymentid;


        const ordedetails = new Orderdetails({
            userid: userid,
            totalpayment: totalpayment,
            paymentid: paymentid,

        })

        const orderdeta = await ordedetails.save();
        if (!orderdeta) {
            res.status(501).send();
        }
        res.status(201).send(orderdeta)
    } catch (err) {
        console.log(err)
        res.status(500).send();
    }
})

app.get("/Orderdetails", async (req, res) => {
    try {
        const getdataorderdetail = await Orderdetails.find()
            .populate("userid")
        res.status(201).send(getdataorderdetail);
    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }

})
app.patch("/Orderdetails/:id", async (req, res) => {

    try {
        const _id = req.params.id
        const updateorder = await Orderdetails.findByIdAndUpdate(_id, req.body, {
            new: true
        })
        if (!_id) {
            return res.status(401).send();
        }
        else {
            res.status(201).send(updateorder)
        }
    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }


})

app.get("/Orderdetails/:totalpayment", async (req, res) => {

    try {
        const totalpayment = req.params.totalpayment

        const ordedetailget = await Orderdetails.find({ totalpayment: totalpayment })

        if (!ordedetailget) {
            res.status(401).send();
        }
        res.status(201).send(ordedetailget)

    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }

})

app.post("/Customer", async (req, res) => {

    try {
        const name = req.body.name;
        const address = req.body.address;
        const orderid = req.body.orderid;
        const productid = req.body.productid;
        const contact = req.body.contact;
        const typespayment = req.body.typespayment;
        const totalprice = req.body.totalprice;

        const customeror = new Customer({
            name: name,
            address: address,
            orderid: orderid,
            productid: productid,
            contact: contact,
            typespayment: typespayment,
            totalprice: totalprice,
        })

        const customerdetails = await customeror.save();
        if (!customerdetails) {
            res.status(401).send();
        }
        res.status(201).send(customerdetails)
    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }


})

app.get("/Customer", async (req, res) => {

    try {
        const customer = await Customer.find()
            .populate("orderid productid", "_id name ")

        res.status(201).send(customer)
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }

})

app.post("/Cartitem", async (req, res) => {

    const { totaldiscount, orignalprice } = req.body;
    const discountuse = totaldiscount / 100;
    const totalprices = orignalprice - (orignalprice * discountuse)
    const productid = req.body.productid;
    const quntity = req.body.quntity
    try {

        const price = new Cartitem({
            productid: productid,
            quntity: quntity,
            totaldiscount: discountuse,
            orignalprice: orignalprice,
            totalamount: totalprices
        })

        const prices = await price.save();
        res.status(200).json({
            success: [{
                messgae: "Disccount works",
                data: prices
            }]
        })


    } catch (err) {
        console.log(err)
        res.status(500).json({
            success: false,
            error: err.messgae,
        })
    }

})

app.get("/Cartitem" , async (req,res) =>{
    try{
        const getdatacartitem = await Cartitem.find()
        .populate("productid","_id productImage")
    
        res.status(201).json({
            success:[{
                messgae : "getdata",
                data:getdatacartitem
            }]
        })
    }catch(err){
       console.log(err)
       res.status(500).json({
           success:false,
           error:err.messgae
       })
    }

})

app.post("/Userpayment" ,async (req,res)=>{

    try{
        const userid = req.body.userid;
        const typespayment = req.body.typespayment;
        const account_no = req.body.account_no;
        const paymentdate = req.body.paymentdate;
        const phone = req.body.phone;
    
        const userpayment = new Userpayment({
            userid :userid,
            typespayment : typespayment,
            account_no:account_no,
            paymentdate:paymentdate,
            phone:phone
        })
    
        const userpaymnet = await userpayment.save();
        if(!userpaymnet) {
            res.status(401).send();
        }
        res.status(201).send(userpaymnet)

    }catch(err){
     console.log(err)
     res.status(err).send(err)
    }
    
  
     
})

app.get("/Userpayment" , async (req,res) =>{
    try{
        const getdatauserpayment = await Userpayment.find()
        .populate("userid")
    
        res.status(201).json({
            success:[{
                messgae : "getdata",
                data:getdatauserpayment
            }]
        })
    }catch(err){
       console.log(err)
       res.status(500).json({
           success:false,
           error:err.messgae
       })
    }

})

app.post("/Payment" ,async(req,res)=>{

    try{
        const pmode = req.body.pmode
        const chequeno = req.body.chequeno
        const chequedate = req.body.chequedate
        const bankname = req.body.bankname
        const paymentdate = req.body.paymentdate
    
        const paymenr = new Payment({
            pmode:pmode,
            chequeno:chequeno,
            chequedate:chequedate,
            bankname:bankname,
            paymentdate:paymentdate
        })
    
        const paymentdata = await paymenr.save();
    
        if(!paymentdata){
            res.status(401).send();
        }
    
        res.status(201).send(paymentdata)
    }catch(err){
       console.log(err)
       res.status(500).send(err)
    }

})

app.get("/Payment" ,async (req,res) =>{
    try{
        const getpaymentdata = await Payment.find()
        res.status(201).send(getpaymentdata)
    }catch(err){
        console.log(err)
        res.status(500).send(err)
    }

})

app.post("/Paymentdetails", async (req, res) => {

    try {
   
        const orderid = req.body.orderid;
        const productid = req.body.productid;
        const quntity = req.body.quntity;
        const pymode = req.body.pymode;
        const pymentdate = req.body.pymentdate;

        const paymentdetails = new Paymentdetails({
        
            orderid: orderid,
            productid: productid,
            quntity: quntity,
            pymode: pymode,
            pymentdate: pymentdate,
        })

        const paymentdetailss = await paymentdetails.save();
        if (!paymentdetailss) {
            res.status(401).send();
        }
        res.status(201).send(paymentdetailss)
    } catch (err) {
        console.log(err)
        res.status(501).send(err)
    }


})

app.get("/Paymentdetails" ,async(req,res) =>{

    try {
        const getpaymentdetaildata = await Paymentdetails.find()
        .populate("orderid productid")
    
        res.status(201).send(getpaymentdetaildata)
    }catch(err){
       console.log(err)
       res.status(500).send(err)
    }


})

app.post("/Reviwe" , async (req,res) =>{
    try{
        const cid  = req.body.cid;
        const productid = req.body.productid;
        const reviwe = req.body.reviwe;
        const dateofreviwe = req.body.dateofreviwe;
       
        const reviwes = new Reviwe({
            cid :cid,
            productid:productid,
            reviwe:reviwe,
            dateofreviwe:dateofreviwe
        })
    
        const reviwess = await reviwes.save();
        res.status(201).send(reviwess)
        
    }catch(err){
      console.log(err)
      res.status(err).send(err)
    }

})

app.get("/Reviwe" , async(req,res) =>{

    try{
        const getdatareviwe = await Reviwe.find()
        .populate("cid productid" ,"_id name" )
    
     if(!getdatareviwe){
         res.status(401).send();
     }
        res.status(201).send(getdatareviwe)
    }catch( err){
    console.log(err)
    res.status(201).send(err)
    }

})


app.listen(port, () => {
    console.log(`port number ${port}`)
})