const router=require('express').Router();
const bcrypt=require('bcryptjs');
const {ObjectId}=require('mongodb');
const connectToDatabase=require('../models/db');
const {authenticate,token}=require('../middleware/auth');
const text=v=>typeof v==='string'?v.trim().slice(0,100):'';
const email=v=>text(v).toLowerCase();
router.post('/register',async(req,res,next)=>{
 try{
  const e=email(req.body.email),firstName=text(req.body.firstName),lastName=text(req.body.lastName),password=req.body.password;
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)||!firstName||!lastName||typeof password!=='string'||password.length<8||Buffer.byteLength(password)>72)return res.status(400).json({error:'Valid names, email and an 8-72 byte password are required'});
  const db=await connectToDatabase();
  const user={email:e,firstName,lastName,name:firstName+' '+lastName,passwordHash:await bcrypt.hash(password,12),createdAt:new Date()};
  const result=await db.collection('users').insertOne(user);user._id=result.insertedId;
  res.status(201).json({message:'User registered successfully',authtoken:token(user),email:e,userName:user.name});
 }catch(e){if(e.code===11000)return res.status(409).json({error:'Email already registered'});next(e);}
});
router.post('/login',async(req,res,next)=>{
 try{
  const e=email(req.body.email),password=req.body.password;
  if(!e||typeof password!=='string'||Buffer.byteLength(password)>72)return res.status(400).json({error:'Email and password required'});
  const db=await connectToDatabase(),user=await db.collection('users').findOne({email:e});
  if(!user||!await bcrypt.compare(password,user.passwordHash))return res.status(401).json({error:'Invalid email or password'});
  res.json({message:'Login successful',authtoken:token(user),userName:user.name,userEmail:user.email});
 }catch(e){next(e);}
});
router.put('/update',authenticate,async(req,res,next)=>{
 try{
  const updates={};
  for(const key of ['firstName','lastName','name'])if(req.body[key]!==undefined){const v=text(req.body[key]);if(!v)return res.status(400).json({error:'Invalid '+key});updates[key]=v;}
  if(!Object.keys(updates).length)return res.status(400).json({error:'No supported profile fields'});
  const db=await connectToDatabase();
  const user=await db.collection('users').findOneAndUpdate({_id:new ObjectId(req.user.sub)},{$set:updates},{returnDocument:'after',projection:{passwordHash:0}});
  if(!user)return res.status(404).json({error:'User not found'});
  res.json({message:'Profile updated',user});
 }catch(e){next(e);}
});
module.exports=router;
