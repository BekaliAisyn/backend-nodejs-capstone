require('dotenv').config();
const express=require('express'),path=require('path'),cors=require('cors');
const connectToDatabase=require('./models/db');
const authRoutes=require('./routes/authRoutes');
const secondChanceItemsRoutes=require('./routes/secondChanceItemsRoutes');
const searchRoutes=require('./routes/searchRoutes');
const {secret}=require('./middleware/auth');
const app=express();
app.disable('x-powered-by');
app.use(cors({origin:process.env.FRONTEND_ORIGIN||false}));
app.use(express.json({limit:'100kb'}));
app.use('/api/auth',authRoutes);
app.use('/api/secondchance/items',secondChanceItemsRoutes);
app.use('/api/secondchance/search',searchRoutes);
app.get('/health',async(req,res,next)=>{try{const db=await connectToDatabase();await db.command({ping:1});res.json({status:'ok',database:'connected'});}catch(e){next(e);}});
app.use('/images',express.static(path.join(__dirname,'public/images')));
const frontend=path.join(__dirname,'../secondChance-frontend/build');
app.get('/',(req,res)=>res.sendFile(path.join(frontend,'home.html')));
app.use(express.static(frontend));
app.get('/app*',(req,res)=>res.sendFile(path.join(frontend,'index.html')));
app.use((req,res)=>res.status(404).json({error:'Route not found'}));
app.use((error,req,res,next)=>{
 const status=error.status||(error.name==='MulterError'?400:500);
 if(status===500)console.error(error.message);
 res.status(status).json({error:status===500?'Internal server error':error.message});
});
if(require.main===module){
 secret();
 connectToDatabase().then(()=>{
  const server=app.listen(process.env.PORT||3060,'0.0.0.0',()=>console.log('SecondChance listening on port '+server.address().port));
  const stop=()=>server.close(async()=>{await connectToDatabase.close();process.exit(0);});
  process.on('SIGTERM',stop);process.on('SIGINT',stop);
 }).catch(e=>{console.error(e.message);process.exitCode=1;});
}
module.exports=app;

