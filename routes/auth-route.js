require('dotenv').config();

const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const {body, validationResult} = require('express-validator');
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

router.post('/register',
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Email is invalid").notEmpty().withMessage("Email is required").custom(async (email) => {
        const existedEmail = await User.findOne({email});
        if (existedEmail) throw new Error("Email is already existed");
    }),
    body("password").notEmpty().withMessage("Password is required").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    async (req,res)=>{
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({errors: errors.array().map((error) => error.msg)});
        }
        const {name, email, password} = req.body;
        try{
            const user = await User.create({name, email, password});
            const info = await transporter.sendMail({
                from: `"Habit Tracker" <${process.env.MY_EMAIL}>`, // sender address
                to: user.email, // list of receivers
                subject: "Email Verification", // Subject line
                text: "Click the link to verify your email", // plain text body
                html: `<h1>Click the following link to verify your email address</h1>
                http://localhost:8000/api/auth/email-verification/${user._id}`, // html body
              });
            return res.status(201).json({message: "User created successfully", user, info});
        }catch(err){
            return res.status(500).json({error: "Internal Server Error", message: err.message});
        }
        
    }
)

router.get('/email-verification/:id', async (req,res)=>{
    
    try{
        const {id} = req.params;
        const user = await User.findByIdAndUpdate(id, {email_verification: true});
        if (!user) {
            return res.status(404).json({error: "User not found"});
        }
        jwt.sign({user}, process.env.JWT_SECRET, {expiresIn: '1h'}, (err, token) => {
            if (err) {
                return res.status(500).json({error: "Internal Server Error", message: err.message});
            }
            return res.status(200).json({
                message: "Email has been verified",
                data: user,
                token: token
            })
        })
        
    }catch(error){
        return res.status(500).json({error: "Internal Server Error", message: error.message});
    }     
})

router.post('/login', 
    body('email').notEmpty().withMessage("Email is required").isEmail().withMessage("Email is invalid").custom(async (email) => {
        const existedEmail = await User.findOne({email});
        if (!existedEmail) throw new Error("Email is not found");
        }),
    body('password').notEmpty().withMessage("Password is required").custom(async(psw)=>{
        const existedPassword = await User.findOne({password: psw});
        if (!existedPassword) throw new Error("Password is incorrect");
    }),
    async (req,res)=>{
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({errors: errors.array().map((error) => error.msg)});
        }
        const {email, password} = req.body;
        const user = await User.findOne({email,password});
        if(!user){
            return res.status(401).json({error: "Unauthorized", message: "Email or password is incorrect"});
        }
        if (!user.email_verification) {
            return res.status(401).json({error: "Unauthorized", message: "Email is not verified"});
        }
        
        jwt.sign({user}, process.env.JWT_SECRET, {expiresIn: '1h'}, (err, token) => {
            if (err) {
                return res.status(500).json({error: "Internal Server Error", message: err.message});
            }
            return res.status(200).json({
                message: "Login successfully",
                data: user,
                token: token
            })
        })
    
})

module.exports = router;