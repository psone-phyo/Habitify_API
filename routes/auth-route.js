require('dotenv').config();

const express = require('express');
const router = express.Router();
const User = require('../models/UserModel');
const {body, validationResult, param} = require('express-validator');
const jwt = require('jsonwebtoken');
const { sendEmailVerification, resetPassword } = require('../utils/EmailVerification');
const { authenticateToken } = require('../utils/AuthenticateToken');
const { hashPassword, verifyPassword } = require('../utils/HashPassword');

router.post('/login', 
    body('email').notEmpty().withMessage("Email is required").isEmail().withMessage("Email is invalid"),
    body('password').notEmpty().withMessage("Password is required"),
    async (req,res)=>{
        const errors = validationResult(req);
        if (!errors.isEmpty()){
            return res.status(400).json({errors: errors.array().map((error) => error.msg)});
        }
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({error: "Unauthorized", message: "Email is not found"});
        }
        const isPasswordMatch = await verifyPassword(password, user.password);
        if (!isPasswordMatch) return res.status(401).json({error: "Unauthorized", message: "Password is incorrect"});

        if (!user.email_verification) {
            return res.status(401).json({error: "Unauthorized", message: "Email is not verified"});
        }
        delete user._doc.password;        
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
        const hashedPassword = await hashPassword(password);
        try{
            const user = await User.create({name, email, password: hashedPassword});
            await sendEmailVerification(user);
            return res.status(201).json({message: "Email Verification sent", data: user});
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
        delete user._doc.password;
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

router.get('/email-verification/resend/:id',
    param('id').notEmpty().withMessage("User ID is required"),
    async (req,res)=>{
    const {id} = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(400).json({error: "Bad Request", message: "User not found"});
    if (user){
        if (user.email_verification) return res.status(400).json({error: "Bad Request", message: "Email is already verified"});
    }
    try{
        await sendEmailVerification(user);
        return res.status(200).json({message: "Email Verification sent"});
    }catch(error){
        return res.status(500).json({error: "Internal Server Error", message: error.message});
    }
})

router.post('/forget-password/mail',authenticateToken, async (req,res)=>{
    const {redirectLink} = req.body;
    if (!redirectLink) return res.status(400).json({error: "Bad Request", message: "Redirect link is required"});

    const {user} = req.user;
    const existedUser = await User.findById(user._id);
    if (!existedUser) return res.status(400).json({error: "Bad Request", message: "User not found"});
    if (!existedUser.email_verification) return res.status(400).json({error: "Bad Request", message: "Email is not verified"});
    try{
        await resetPassword(existedUser, redirectLink);
        return res.status(200).json({message: "Reset password link is sent to your email"});
    }catch(error){
        return res.status(500).json({error: "Internal Server Error", message: error.message});
    }
})

router.post('/forget-password', authenticateToken, async(req,res)=>{
    const {password} = req.body;
    if (!password) return res.status(400).json({error: "Bad Request", message: "Password is required"});
    const {user} = req.user;
    const existedUser = await User.findById(user._id);
    if (!existedUser) return res.status(400).json({error: "Bad Request", message: "User not found"});
    if (!existedUser.email_verification) return res.status(400).json({error: "Bad Request", message: "Email is not verified"});
    const hashedPassword = await hashPassword(password);

    try{
        await User.findByIdAndUpdate(user._id, {password: hashedPassword});
        return res.status(200).json({message: "Password has been reset"});
    }catch(error){
        return res.status(500).json({error: "Internal Server Error", message: error.message});
    }
    
})

module.exports = router;