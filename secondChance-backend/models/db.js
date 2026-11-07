require('dotenv').config();
const {MongoClient}=require('mongodb');
let client, pending;
async function connectToDatabase(){
 if(!pending){
  client=new MongoClient(process.env.MONGO_URL||'mongodb://127.0.0.1:27018',{serverSelectionTimeoutMS:10000});
  pending=(async()=>{
   await client.connect();
   const db=client.db(process.env.MONGO_DB||'secondChance');
   await db.collection('users').createIndex({email:1},{unique:true});
   await db.collection('secondChanceItems').createIndex({id:1},{unique:true});
   return db;
  })().catch(async e=>{pending=null;await client.close();throw e;});
 }
 return pending;
}
connectToDatabase.close=async()=>{if(client)await client.close();pending=null;};
module.exports=connectToDatabase;

