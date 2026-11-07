const router=require('express').Router();
const multer=require('multer'),path=require('path'),fs=require('fs');
const {randomUUID}=require('crypto');
const {ObjectId}=require('mongodb');
const connectToDatabase=require('../models/db');
const {authenticate}=require('../middleware/auth');
const directoryPath=path.join(__dirname,'../public/images');
fs.mkdirSync(directoryPath,{recursive:true});
const extensions={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp'};
const upload=multer({
 storage:multer.diskStorage({destination:directoryPath,filename:(req,file,cb)=>cb(null,randomUUID()+extensions[file.mimetype])}),
 limits:{fileSize:2097152,files:1},
 fileFilter:(req,file,cb)=>cb(extensions[file.mimetype]?null:Object.assign(new Error('Only PNG, JPEG and WebP accepted'),{status:400}),!!extensions[file.mimetype])
});
function filter(id){if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(id))return null;return ObjectId.isValid(id)?{$or:[{id},{_id:new ObjectId(id)}]}:{id};}
function fields(body,partial=false){
 const out={};
 for(const key of ['name','category','condition','zipcode','description']){
  if(partial&&body[key]===undefined)continue;
  if(typeof body[key]!=='string'||!body[key].trim()||body[key].length>(key==='description'?5000:150))throw Object.assign(new Error('Invalid '+key),{status:400});
  out[key]=body[key].trim();
 }
 if(!partial||body.age_days!==undefined){const age=Number(body.age_days||0);if(!Number.isFinite(age)||age<0||age>36500)throw Object.assign(new Error('Invalid age_days'),{status:400});out.age_days=age;out.age_years=Number((age/365).toFixed(2));}
 return out;
}
router.get('/',async(req,res,next)=>{
 try{const db=await connectToDatabase();res.json(await db.collection('secondChanceItems').find({}).sort({date_added:-1}).limit(1000).toArray());}catch(e){next(e);}
});
router.post('/',authenticate,upload.single('file'),async(req,res,next)=>{
 try{
  const item={...fields(req.body),id:randomUUID(),posted_by:req.user.sub,date_added:Math.floor(Date.now()/1000),comments:[],image:''};
  if(req.file){
   const b=fs.readFileSync(req.file.path);
   const png=b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
   const jpg=b[0]===255&&b[1]===216&&b[2]===255;
   const webp=b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
   if(!png&&!jpg&&!webp)throw Object.assign(new Error('Invalid image content'),{status:400});
   item.image='/images/'+req.file.filename;
  }
  const db=await connectToDatabase(),result=await db.collection('secondChanceItems').insertOne(item);
  res.status(201).json({...item,_id:result.insertedId});
 }catch(e){if(req.file)fs.unlink(req.file.path,()=>{});next(e);}
});
router.get('/:id',async(req,res,next)=>{
 try{const q=filter(req.params.id);if(!q)return res.status(400).json({error:'Invalid item id'});const db=await connectToDatabase(),item=await db.collection('secondChanceItems').findOne(q);if(!item)return res.status(404).json({error:'Item not found'});res.json(item);}catch(e){next(e);}
});
router.put('/:id',authenticate,async(req,res,next)=>{
 try{
  const q=filter(req.params.id);if(!q)return res.status(400).json({error:'Invalid item id'});
  const db=await connectToDatabase(),c=db.collection('secondChanceItems'),item=await c.findOne(q);
  if(!item)return res.status(404).json({error:'Item not found'});
  if(item.posted_by!==req.user.sub)return res.status(403).json({error:'Only the owner may update an item'});
  const changes=fields(req.body,true);if(!Object.keys(changes).length)return res.status(400).json({error:'No item fields supplied'});
  res.json(await c.findOneAndUpdate({_id:item._id,posted_by:req.user.sub},{$set:changes},{returnDocument:'after'}));
 }catch(e){next(e);}
});
router.delete('/:id',authenticate,async(req,res,next)=>{
 try{
  const q=filter(req.params.id);if(!q)return res.status(400).json({error:'Invalid item id'});
  const db=await connectToDatabase(),c=db.collection('secondChanceItems'),item=await c.findOne(q);
  if(!item)return res.status(404).json({error:'Item not found'});
  if(item.posted_by!==req.user.sub)return res.status(403).json({error:'Only the owner may delete an item'});
  const result=await c.deleteOne({_id:item._id,posted_by:req.user.sub});
  res.json({message:'Item deleted',deletedCount:result.deletedCount});
 }catch(e){next(e);}
});
router.post('/:id/comments',authenticate,async(req,res,next)=>{
 try{
  const q=filter(req.params.id),comment=req.body.comment;
  if(!q||typeof comment!=='string'||!comment.trim()||comment.length>1000)return res.status(400).json({error:'Invalid comment or item id'});
  const entry={id:randomUUID(),author:req.user.email,comment:comment.trim(),createdAt:new Date()};
  const db=await connectToDatabase(),result=await db.collection('secondChanceItems').updateOne(q,{$push:{comments:entry}});
  if(!result.matchedCount)return res.status(404).json({error:'Item not found'});
  res.status(201).json(entry);
 }catch(e){next(e);}
});
module.exports=router;

