const jwt=require('jsonwebtoken');
function secret(){if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)throw new Error('Set JWT_SECRET to at least 32 random characters');return process.env.JWT_SECRET;}
function authenticate(req,res,next){
 const m=/^Bearer (\S+)$/.exec(req.get('Authorization')||'');
 if(!m)return res.status(401).json({error:'Authentication required'});
 try{req.user=jwt.verify(m[1],secret(),{algorithms:['HS256'],issuer:'secondchance'});next();}
 catch{res.status(401).json({error:'Invalid or expired token'});}
}
function token(u){return jwt.sign({sub:String(u._id),email:u.email},secret(),{expiresIn:'1h',issuer:'secondchance',algorithm:'HS256'});}
module.exports={authenticate,token,secret};
