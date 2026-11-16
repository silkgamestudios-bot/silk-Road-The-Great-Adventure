/* WhatsApp para recuperar cuentas: envía al jugador su clave temporal, sola y automática.
   Proveedor (WA_PROVIDER): meta · twilio · http · test.  Si no hay ninguno configurado, on() es false y accounts.js
   avisa al soporte (Zona GM) en lugar de enviar. Guía paso a paso: LEEME_GUIAS_PAGOS_Y_WHATSAPP.md (sección 4)
   Variables (Render > Environment):
     meta   : WA_TOKEN, WA_PHONE_ID, WA_TEMPLATE (plantilla de AUTENTICACIÓN aprobada), WA_TEMPLATE_LANG (por defecto es), WA_API_VERSION
     twilio : TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM (whatsapp:+1…), TWILIO_CONTENT_SID (opcional: plantilla aprobada)
     http   : WA_HTTP_URL, WA_HTTP_TOKEN (opcional), WA_HTTP_HEADERS (JSON opcional), WA_HTTP_BODY (JSON opcional con {{to}} {{text}} {{code}})
     test   : escribe DATA_DIR/outbox_wa.json (solo para pruebas) */
const fs=require('fs');
module.exports=function(ctx){
const E=process.env,log=(ctx&&ctx.log)||(()=>{});
let P=String(E.WA_PROVIDER||'').trim().toLowerCase();
if(!P){if(E.WA_TOKEN&&E.WA_PHONE_ID&&E.WA_TEMPLATE)P='meta';else if(E.TWILIO_SID&&E.TWILIO_TOKEN&&E.TWILIO_FROM)P='twilio';else if(E.WA_HTTP_URL)P='http'}
const on=()=>P==='test'||(P==='meta'&&!!(E.WA_TOKEN&&E.WA_PHONE_ID))||(P==='twilio'&&!!(E.TWILIO_SID&&E.TWILIO_TOKEN&&E.TWILIO_FROM))||(P==='http'&&!!E.WA_HTTP_URL);
const TO=()=>typeof AbortSignal!=='undefined'&&AbortSignal.timeout?AbortSignal.timeout(12000):undefined;
async function chk(r,who){if(r.ok)return true;let t='';try{t=(await r.text()).replace(/\s+/g,' ').slice(0,220)}catch(e){}throw new Error(who+' '+r.status+' '+t)}
/* to = número en formato internacional SIN el + (ej. 18095551234) · code = la clave temporal · text = mensaje completo para proveedores que mandan texto libre */
async function send(to,code,text){
 to=String(to||'').replace(/\D/g,'');if(!to)throw new Error('sin número');
 if(!on())throw new Error('WhatsApp sin configurar');
 if(P==='test'){const f=(E.DATA_DIR||'.')+'/outbox_wa.json';let o=[];try{o=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){}o.push({to,code,text,ts:Date.now()});fs.writeFileSync(f,JSON.stringify(o));return true}
 if(P==='meta'){
  const body=E.WA_TEMPLATE
   ?{messaging_product:'whatsapp',recipient_type:'individual',to,type:'template',template:{name:E.WA_TEMPLATE,language:{code:E.WA_TEMPLATE_LANG||'es'},components:[
     {type:'body',parameters:[{type:'text',text:code}]},                                   /* plantilla de autenticación: el mismo código va en el cuerpo… */
     {type:'button',sub_type:'url',index:'0',parameters:[{type:'text',text:code}]}]}}      /* …y en el botón «Copiar código» */
   :{messaging_product:'whatsapp',recipient_type:'individual',to,type:'text',text:{preview_url:false,body:text}};   /* sin plantilla: solo llega si el jugador te escribió en las últimas 24 h */
  const r=await fetch((E.WA_API_BASE||'https://graph.facebook.com')+'/'+(E.WA_API_VERSION||'v23.0')+'/'+encodeURIComponent(E.WA_PHONE_ID)+'/messages',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+E.WA_TOKEN},body:JSON.stringify(body),signal:TO()});
  return chk(r,'meta')}
 if(P==='twilio'){
  const fr='whatsapp:+'+String(E.TWILIO_FROM).trim().replace(/^whatsapp:/i,'').replace(/^\+/,'');
  const q=new URLSearchParams({From:fr,To:'whatsapp:+'+to});
  if(E.TWILIO_CONTENT_SID){q.set('ContentSid',E.TWILIO_CONTENT_SID);q.set('ContentVariables',JSON.stringify({'1':code}))}else q.set('Body',text);
  const r=await fetch((E.TWILIO_API_BASE||'https://api.twilio.com')+'/2010-04-01/Accounts/'+encodeURIComponent(E.TWILIO_SID)+'/Messages.json',{method:'POST',headers:{authorization:'Basic '+Buffer.from(E.TWILIO_SID+':'+E.TWILIO_TOKEN).toString('base64'),'content-type':'application/x-www-form-urlencoded'},body:q.toString(),signal:TO()});
  return chk(r,'twilio')}
 if(P==='http'){
  const v={to,text,code},esc=s=>JSON.stringify(String(s)).slice(1,-1);
  const body=E.WA_HTTP_BODY?E.WA_HTTP_BODY.replace(/\{\{(to|text|code)\}\}/g,(m,k)=>esc(v[k])):JSON.stringify({to,phone:to,number:to,message:text,text,body:text,code});
  let h={'content-type':'application/json'};if(E.WA_HTTP_TOKEN)h.authorization='Bearer '+E.WA_HTTP_TOKEN;
  if(E.WA_HTTP_HEADERS){try{Object.assign(h,JSON.parse(E.WA_HTTP_HEADERS))}catch(e){log('WA_HTTP_HEADERS no es un JSON válido')}}
  const r=await fetch(E.WA_HTTP_URL,{method:'POST',headers:h,body,signal:TO()});
  return chk(r,'http')}
 throw new Error('proveedor de WhatsApp desconocido: '+P)}
return{on,send,provider:()=>on()?P:''}};
