const router=require('express').Router();
const connectToDatabase=require('../models/db');
router.get('/',async(req,res,next)=>{
 try{
  const query={};
  for(const key of ['name','category','condition','age_years'])if(req.query[key]!==undefined&&typeof req.query[key]!=='string')return res.status(400).json({error:'Invalid '+key});
  if(req.query.name)query.name={$regex:req.query.name.slice(0,100).replace(/[.*+?^$()|[\]{}\\]/g,'\\$&'),$options:'i'};
  if(req.query.category)query.category=req.query.category;
  if(req.query.condition)query.condition=req.query.condition;
  if(req.query.age_years){const age=Number(req.query.age_years);if(!Number.isFinite(age)||age<0)return res.status(400).json({error:'Invalid age_years'});query.age_years={$lte:age};}
  const db=await connectToDatabase();
  res.json(await db.collection('secondChanceItems').find(query).limit(1000).toArray());
 }catch(e){next(e);}
});
module.exports=router;

