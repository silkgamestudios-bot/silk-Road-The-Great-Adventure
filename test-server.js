/* Pruebas del servidor: node tools/test-server.js  (arranca el servidor en puertos locales con Google y WhatsApp simulados) */
const {spawn}=require('child_process'),http=require('http'),fs=require('fs'),os=require('os'),path=require('path');
const WS=require(path.join(__dirname,'../server/node_modules/ws'));
let pass=0,fail=0;const ok=(c,n)=>{if(c){pass++;console.log('  ✔',n)}else{fail++;console.log('  ✘ FALLA:',n)}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function client(port,hi){return new Promise((res,rej)=>{const ws=new WS('ws://localhost:'+port),box={ws,rid:0,pend:{},msgs:[]};
 ws.on('open',()=>ws.send(JSON.stringify(hi)));
 ws.on('message',d=>{const m=JSON.parse(d);box.msgs.push(m);if(m.t==='ok'){box.ok=m;res(box)}else if(m.t==='auth'||m.t==='bad'){box.auth=m;res(box)}else if(m.t==='r'&&box.pend[m.rid]){box.pend[m.rid](m);delete box.pend[m.rid]}});
 ws.on('close',()=>res(box));setTimeout(()=>res(box),3000)})}
const call=(b,m)=>new Promise(r=>{m.rid=++b.rid;b.pend[m.rid]=r;b.ws.send(JSON.stringify(m));setTimeout(()=>r({ok:0,e:'timeout'}),2000)});
const set=(b,col,id,d)=>call(b,{t:'set',col,id,d});
function start(env){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sr-'));const p=spawn('node',[path.join(__dirname,'../server/server.js')],{env:Object.assign({},process.env,{DATA_DIR:dir},env),stdio:'ignore'});return{p,dir}}
const END=Date.now()+9e5;
(async()=>{
 /* ===== 1) MODO INVITADO: reglas de party, mercado, mascotas, gemas ===== */
 console.log('Reglas (invitados)');let S=start({PORT:'8201',MASTER_UID:'pmaster'});await sleep(900);
 const A=await client(8201,{t:'hi',uid:'pAAAA',tok:'ta'}),B=await client(8201,{t:'hi',uid:'pBBBB',tok:'tb'}),M=await client(8201,{t:'hi',uid:'pmaster',tok:'tm'});
 ok(A.ok&&B.ok&&M.ok,'login de 3 jugadores');
 const A2=await client(8201,{t:'hi',uid:'pAAAA',tok:'otro'});ok(A2.auth&&A2.auth.t==='bad','no se puede suplantar un uid con otro token');
 ok((await set(A,'pres','pAAAA',{n:'A',l:5})).ok,'party: presencia propia');ok(!(await set(A,'pres','pBBBB',{n:'x'})).ok,'party: no escribir presencia ajena');
 ok((await set(A,'pinv','i1',{from:'pAAAA',to:'pBBBB',p:'x'})).ok,'party: invitar');
 ok(!(await set(B,'pinv','i2',{from:'pAAAA',to:'pBBBB'})).ok,'party: no falsificar el remitente de una invitación');
 ok((await set(A,'pkill','k1',{from:'pAAAA',xp:5})).ok,'party: reparto de kill propio');ok(!(await set(B,'pkill','k2',{from:'pAAAA',xp:5})).ok,'party: no falsificar kill ajeno');
 ok(!(await set(A,'shops','pAAAA',{n:'tienda'})).ok,'mercado: las tiendas solo las escribe el servidor');ok(!(await set(B,'shops','pAAAA',{n:'hack'})).ok,'mercado: no editar tienda ajena');
 ok(!(await set(A,'orders','o1',{from:'pAAAA',to:'pBBBB',it:1,p:10})).ok,'mercado: pedidos escritos por el cliente → rechazados');ok(!(await set(B,'orders','o9',{from:'pAAAA',to:'pBBBB'})).ok,'mercado: no falsificar pedido');
 ok(!(await set(A,'offers','f1',{u:'pAAAA',p:100,pet:{k:'dog'}})).ok,'mercado: ofertas escritas por el cliente → rechazadas');ok(!(await set(B,'offers','f1',{u:'pAAAA',p:1,pet:{k:'dog'}})).ok,'mercado: no cambiar el precio de otro');
 ok(!(await set(A,'offers','au',{u:'pAAAA',nm:'A',pet:{k:'dog'},p:100,auc:1,end:END,bid:0,bu:'',bn:'',bo:''})).ok,'subastas: solo el servidor las abre');
 ok(!(await set(B,'offers','au',{u:'pAAAA',nm:'A',pet:{k:'dog'},p:100,auc:1,end:END,bid:150,bu:'pBBBB',bn:'B',bo:''})).ok,'subastas: pujas por escritura directa → rechazadas');
 ok(!(await set(B,'offers','au',{u:'pAAAA',nm:'A',pet:{k:'dog'},p:1,auc:1,end:END,bid:160,bu:'pBBBB',bn:'B',bo:''})).ok,'mascotas: no bajar el precio base en una puja');
 ok(!(await set(A,'wallets','pAAAA',{gem:0,gemT:0})).ok,'gemas: la billetera ya no se escribe desde el cliente');ok(!(await set(A,'wallets','pAAAA',{gem:900,gemT:0})).ok,'gemas: inflar saldo → rechazado');
 ok(!(await set(A,'gemgrant','g1',{to:'pAAAA',q:500,by:'pAAAA'})).ok,'gemas: un jugador no puede darse gemas');
 ok((await set(M,'gemgrant','g2',{to:'pAAAA',q:500,by:'pmaster'})).ok,'gemas: el master concede gemas');
 await sleep(300);const me1=await call(A,{t:'x',op:'me.get'});ok(me1.ok&&me1.ent.gem===500,'gemas: el servidor acredita lo concedido y lo informa');
 const bs1=await call(A,{t:'x',op:'skin.buy',id:'b0_0'});ok(bs1.ok&&bs1.ent.sk.includes('b0_0')&&bs1.ent.gem<500,'tienda: comprar apariencia descuenta gemas en el servidor');ok(!(await call(A,{t:'x',op:'skin.buy',id:'b0_0'})).ok,'tienda: no se compra dos veces');ok(!(await call(B,{t:'x',op:'skin.buy',id:'b0_3'})).ok,'tienda: sin gemas no se compra');
 ok(!(await call(A,{t:'x',op:'gem.tx',to:'pAAAA',q:5})).ok,'gemas: no enviarte gemas a ti mismo');
 const gg=await call(A,{t:'x',op:'op.inexistente'});ok(!gg.ok,'operaciones desconocidas → rechazadas');
 ok(!(await set(A,'cfg','master',{u:'pAAAA'})).ok,'master: un jugador no puede nombrarse master');
 S.p.kill();await sleep(300);

 /* ===== 2) MODO GOOGLE + WHATSAPP + NUBE ===== */
 console.log('Google, master, WhatsApp y guardado en la nube');
 const TK={'tokA':{sub:'111',email:'jugador@gmail.com',name:'Jugador'},'tokM':{sub:'999',email:'crazzyminnd@gmail.com',name:'Master'}};
 const tokSrv=http.createServer((q,r)=>{const t=decodeURIComponent((q.url.split('id_token=')[1]||'')),u=TK[t.replace('BADAUD','')];if(!u){r.writeHead(400);r.end('{}');return}
  r.end(JSON.stringify({aud:t.endsWith('BADAUD')?'otro-cliente':'CID.apps.googleusercontent.com',iss:'https://accounts.google.com',email_verified:'true',exp:String(Math.floor(Date.now()/1000)+3000),sub:u.sub,email:u.email,name:u.name}))}).listen(8210);
 const wa=[];const waSrv=http.createServer((q,r)=>{wa.push(decodeURIComponent(q.url));r.end('ok')}).listen(8211);
 S=start({PORT:'8202',GOOGLE_CLIENT_ID:'CID.apps.googleusercontent.com',GOOGLE_TOKENINFO_URL:'http://localhost:8210/?id_token=',MASTER_EMAIL:'crazzyminnd@gmail.com',CALLMEBOT_KEY:'KEY123',CALLMEBOT_URL:'http://localhost:8211/wa',MASTER_WHATSAPP:'18093965707',BINANCE_PAY_ID:'748095851'});await sleep(900);
 const G0=await client(8202,{t:'hi',uid:'pinv1',tok:'x'});ok(G0.auth&&G0.auth.t==='auth','los invitados ya no entran cuando Google está activo');
 const G1=await client(8202,{t:'hi',g:'tokAAAA-malo'});ok(G1.auth,'token de Google falso → rechazado');
 const G2=await client(8202,{t:'hi',g:'tokABADAUD'});ok(G2.auth,'token de otra app (aud distinto) → rechazado');
 const GA=await client(8202,{t:'hi',g:'tokA'});ok(GA.ok&&GA.ok.uid&&GA.ok.ses&&!GA.ok.master,'login con Google (jugador normal)');
 const GA2=await client(8202,{t:'hi',ses:GA.ok.ses});ok(GA2.ok&&GA2.ok.uid===GA.ok.uid,'sesión guardada reconecta a la misma cuenta');await sleep(300);ok(GA.msgs.some(m=>m.t==='kick'),'una cuenta solo puede estar en un dispositivo a la vez');
 const GM=await client(8202,{t:'hi',g:'tokM'});ok(GM.ok&&GM.ok.master,'tu Gmail es reconocido como MASTER');
 ok(!(await set(GA2,'cfg','master',{u:GA2.ok.uid})).ok,'otro Gmail no puede volverse master');
 const cfgm=await new Promise(r=>{GA2.ws.send(JSON.stringify({t:'get',col:'cfg',id:'master',rid:77}));GA2.pend[77]=r;setTimeout(()=>r({}),1500)});ok(cfgm.d&&cfgm.d.u===GM.ok.uid,'el servidor registra al master automáticamente');
 const cfgp=await new Promise(r=>{GA2.ws.send(JSON.stringify({t:'get',col:'cfg',id:'pay',rid:78}));GA2.pend[78]=r;setTimeout(()=>r({}),1500)});ok(cfgp.d&&cfgp.d.id==='748095851','Pay ID 748095851 publicado a los jugadores');
 ok((await set(GA2,'gemreq','r1',{u:GA2.ok.uid,nm:'Jugador',usdt:5,gems:55,ref:'ORDEN12345678',st:'p',ts:Date.now()})).ok,'jugador envía comprobante de pago');
 await sleep(500);ok(wa.some(x=>x.includes('phone=18093965707')&&x.includes('apikey=KEY123')&&x.includes('55')&&x.includes('ORDEN12345678')),'WhatsApp al 18093965707 notificado con el pago');
 ok(!(await call(GA2,{t:'set',col:'gemreq',id:'r1',d:{u:GA2.ok.uid,st:'a',usdt:5,gems:55}})).ok,'jugador no puede aprobar su propio pago');
 ok((await call(GM,{t:'upd',col:'gemreq',id:'r1',d:{st:'a',by:GM.ok.uid}})).ok,'master aprueba el pago');
 ok((await call(GA2,{t:'sv',d:'{"lv":7,"xp":10}'})).ok,'guardado en la nube');await sleep(1700);const GA3=await client(8202,{t:'hi',ses:GA.ok.ses});const ld=await call(GA3,{t:'ld'});ok(ld.d&&JSON.parse(ld.d).lv===7,'la nube devuelve tu progreso en otro dispositivo');
 const ldm=await call(GM,{t:'ld'});ok(ldm.d===null,'cada cuenta tiene su propio guardado');
 S.p.kill();tokSrv.close();waSrv.close();
 console.log('\nResultado:',pass,'bien,',fail,'fallas');process.exit(fail?1:0)})();
