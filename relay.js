/* Relay mínimo para Binance: se despliega en una región permitida (Frankfurt) y reenvía solo 2 consultas de lectura.
   No guarda claves: la firma la hace el servidor principal. Protegido con RELAY_TOKEN. */
const http=require('http'),https=require('https');
const TOKEN=String(process.env.RELAY_TOKEN||'').trim();
const OK=new Set(['/sapi/v1/pay/transactions','/api/v3/time']);
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x');
 if(u.pathname==='/'){res.end('ok');return}
 if(!TOKEN||req.headers['x-relay-token']!==TOKEN){res.statusCode=401;return res.end('{"msg":"no auth"}')}
 if(req.method!=='GET'||!OK.has(u.pathname)){res.statusCode=404;return res.end('{"msg":"no"}')}
 const h={};if(req.headers['x-mbx-apikey'])h['X-MBX-APIKEY']=req.headers['x-mbx-apikey'];
 const p=https.request({host:'api.binance.com',path:u.pathname+u.search,method:'GET',headers:h},r=>{res.statusCode=r.statusCode;res.setHeader('content-type','application/json');r.pipe(res)});
 p.on('error',e=>{res.statusCode=502;res.end(JSON.stringify({msg:'relay '+e.message}))});p.setTimeout(15000,()=>p.destroy(new Error('timeout')));p.end();
}).listen(process.env.PORT||10000,()=>console.log('[relay] listo'));
