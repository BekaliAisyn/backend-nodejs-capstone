require('dotenv').config();
const connectToDatabase=require('../../models/db');
const data=require('./secondChanceItems.json').docs;
async function loadData(){
 const db=await connectToDatabase();
 const result=await db.collection('secondChanceItems').bulkWrite(data.map(item=>({updateOne:{filter:{id:item.id},update:{$setOnInsert:item},upsert:true}})));
 const count=await db.collection('secondChanceItems').countDocuments({id:{$in:data.map(item=>item.id)}});
 console.log('Inserted documents: '+result.upsertedCount);
 console.log('Imported seed documents present in MongoDB: '+count);
 return {insertedCount:result.upsertedCount,totalSeedDocuments:count};
}
if(require.main===module)loadData().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>connectToDatabase.close());
module.exports={loadData};

