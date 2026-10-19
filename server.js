import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
const app=express();
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'18kb'}));
app.use(express.static('public'));
const required=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY'];
const configured=required.every(k=>process.env[k]&&!process.env[k].startsWith('YOUR_'));
const admin=configured?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}}):null;
const authClient=configured?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}}):null;
const clean=(v,max=200)=>typeof v==='string'?v.trim().slice(0,max):'';
const limiter=rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false});
async function staffAuth(req,res,next){
 if(!configured)return res.status(503).json({error:'Server not configured'});
 const token=(req.headers.authorization||'').match(/^Bearer (.+)$/)?.[1];
 if(!token)return res.status(401).json({error:'Sign in required'});
 const {data:{user},error}=await authClient.auth.getUser(token);
 if(error||!user)return res.status(401).json({error:'Invalid session'});
 const {data:staff}=await admin.from('staff').select('role').eq('user_id',user.id).maybeSingle();
 if(!staff)return res.status(403).json({error:'Not an authorized Team Complex staff member'});
 req.staff={id:user.id,role:staff.role};next();
}
app.get('/api/config',(req,res)=>res.json({supabaseUrl:configured?process.env.SUPABASE_URL:null,supabaseAnonKey:configured?process.env.SUPABASE_ANON_KEY:null}));
app.post('/api/applications',limiter,async(req,res)=>{
 if(!configured)return res.status(503).json({error:'Application database is not connected yet'});
 const d=req.body||{};
 const record={epic_username:clean(d.epic_username,80),discord_username:clean(d.discord_username,80),current_rank:clean(d.current_rank,80),peak_rank:clean(d.peak_rank,80),age:Number(d.age),region:clean(d.region,60),platform:clean(d.platform,60),hours_played:Number(d.hours_played),motivation:clean(d.motivation,2000),tournament_experience:clean(d.tournament_experience,1000),practice_availability:clean(d.practice_availability,1000)};
 if(Object.entries(record).some(([k,v])=>typeof v==='string'?!v:!Number.isInteger(v))||record.age<13||record.age>100||record.hours_played<0||record.hours_played>100000)return res.status(400).json({error:'Complete all fields with valid values (age 13+).'});
 const {error}=await admin.from('applications').insert(record);
 if(error)return res.status(500).json({error:'Could not save application'});
 res.status(201).json({ok:true});
 const webhook=process.env.DISCORD_WEBHOOK_URL;
 if(webhook?.startsWith('https://discord.com/api/webhooks/')){
  const payload={username:'Team Complex Recruitment',embeds:[{title:'New player application',color:3447003,fields:[{name:'Epic username',value:record.epic_username},{name:'Current rank',value:record.current_rank},{name:'Region',value:record.region},{name:'Status',value:'Pending review'}],footer:{text:'Sign in to the private Team Complex dashboard for full details'}}]};
  fetch(webhook,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(6000)}).catch(e=>console.error('Discord notification failed:',e.message));
 }
});
app.get('/api/applications',staffAuth,async(req,res)=>{
 const {data,error}=await admin.from('applications').select('*').order('created_at',{ascending:false}).limit(250);
 if(error)return res.status(500).json({error:'Could not load applications'});
 res.json({applications:data});
});
app.patch('/api/applications/:id',staffAuth,async(req,res)=>{
 if(!['accepted','rejected','pending'].includes(req.body?.status)||!/^[0-9a-f-]{36}$/i.test(req.params.id))return res.status(400).json({error:'Invalid update'});
 const {data,error}=await admin.from('applications').update({status:req.body.status}).eq('id',req.params.id).select('id,status').maybeSingle();
 if(error||!data)return res.status(404).json({error:'Application not found'});
 res.json(data);
});
let cache={at:0,count:null};
app.get('/api/youtube-subscribers',async(req,res)=>{
 if(Date.now()-cache.at<60000&&cache.count!==null)return res.json({subscriberCount:cache.count});
 const key=process.env.YOUTUBE_API_KEY,id=process.env.YOUTUBE_CHANNEL_ID;
 if(!key||!id||key.startsWith('YOUR_')||id.startsWith('YOUR_'))return res.status(503).json({error:'YouTube API not connected yet'});
 try{
  const url=new URL('https://www.googleapis.com/youtube/v3/channels');
  url.search=new URLSearchParams({part:'statistics',id,key}).toString();
  const response=await fetch(url,{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error(`YouTube API ${response.status}`);
  const json=await response.json();const stats=json.items?.[0]?.statistics;
  if(!stats||stats.hiddenSubscriberCount)throw new Error('Subscriber count unavailable');
  cache={at:Date.now(),count:Number(stats.subscriberCount)};
  res.json({subscriberCount:cache.count});
 }catch(e){console.error(e.message);if(cache.count!==null)return res.json({subscriberCount:cache.count,stale:true});res.status(502).json({error:'Live count temporarily unavailable'});}
});
app.listen(process.env.PORT||3000,()=>console.log(`Team Complex running on port ${process.env.PORT||3000}`));
