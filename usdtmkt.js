/* Silk Road · MERCADO USDT con garantía (escrow) · todo pasa por NUESTRO Binance Pay (sin MetaMask ni blockchain).
   Flujo:
   1. El vendedor publica (objeto, mascota, boleto o gemas) con precio en USDT + su ID de Binance Pay y su usuario de Binance.
      El servidor retiene lo publicado (garantía): nadie más lo puede usar mientras esté a la venta.
   2. El comprador pulsa Comprar → el servidor reserva el anuncio y crea una orden de pago con un monto ÚNICO (precio − 0.01…0.49).
      Paga ese monto exacto al Pay ID del juego.
   3. pay.js lee el historial de Binance Pay (API de solo lectura) y, al ver el pago, llama a onMk(): el servidor entrega lo comprado,
      avisa al comprador (buzón + aviso), avisa al vendedor y te manda a ti (master) el aviso con todos los datos para pagar al vendedor.
   4. Tú pagas al vendedor su precio − 5% de comisión (en USDT) por Binance Pay y lo marcas como pagado (el vendedor recibe aviso).
   Todo importe son centavos enteros. Cada pago de Binance se usa UNA sola vez (lo garantiza pay.js con el ID de transacción). */
module.exports=function(S,E,X){
const {PY,MK,CM}=X,DB=S.DB,log=S.log;
const FEE_BPS=500;                                   /* 5% de comisión sobre el precio de venta, descontada al vendedor */
const MIN_C=100,MAX_C=5e6;                           /* 1.00 a 50 000.00 USDT */
const MAXL=15,BXMAX=80;
const now=()=>Date.now(),err=e=>({e});
const U=()=>{const d=DB.um=DB.um||{};d.o=d.o||{};d.s=d.s||{};d.bx=d.bx||{};d.pf=d.pf||{};return d};
const fmt=c=>(c/100).toFixed(2);
const nmOf=u=>{const a=E.acct(u);return String((a&&(a.nm||a.pn))||'Jugador').slice(0,24)};
const prim=u=>{try{return E.prim(u)}catch(e){return u}};
const KINDS=['it','pet','tk','gem'];
function inbox(u,m,k){const b=U().bx,p=prim(u);const l=b[p]=b[p]||[];l.unshift({t:now(),m:String(m).slice(0,240),k:k||''});if(l.length>BXMAX)l.length=BXMAX;S.dirty();
 try{S.push(u,{t:'note',m:String(m).slice(0,200)})}catch(e){}}
function desc(L){if(L.k==='g')return L.q+' 💎 gemas';if(L.it)return L.it.n||'Objeto';if(L.pet)return '🐾 '+(L.pet.n||L.pet.nm||'Mascota');if(L.tk)return '🎫 '+(L.q|0)+'× boleto '+L.tk;return 'Artículo'}
function view(L,u){const mine=L.u===u||prim(L.u)===prim(u);return{id:L.id,k:L.k||(L.it?'it':L.pet?'pet':L.tk?'tk':'?'),d:desc(L),pc:L.pc/100,sn:L.nm,mine:mine?1:0,st:L.st,ts:L.ts,it:L.it||null,pet:L.pet||null,tk:L.tk||'',q:L.q|0,buy:L.b&&(L.b===u||prim(L.b)===prim(u))?1:0}}

/* una reserva se libera si su orden de pago venció sin pagarse */
function sweep(){const d=U();let ch=0;for(const id in d.o){const L=d.o[id];if(L.st!=='r')continue;const o=PY.get(L.oid);if(!o||(o.st!=='paid'&&o.st!=='p')||(o.st==='p'&&now()>=o.x)){L.st='o';delete L.b;delete L.oid;ch=1}}if(ch)S.dirty()}
const hasActive=u=>{const p=prim(u);return Object.values(U().o).find(L=>L.st==='r'&&L.b&&prim(L.b)===p)||null};

const ops={};
ops['um.list']=(u,m)=>{sweep();const k=String(m.k||'');const l=Object.values(U().o).filter(L=>!k||L.k===k).sort((a,b)=>b.ts-a.ts).slice(0,200).map(L=>view(L,u));return{ok:1,l,on:PY.on(),pid:PY.PAY_ID,fee:FEE_BPS/100}};

ops['um.sell']=(u,m)=>{sweep();if(!PY.on())return err('El mercado USDT aún no está activado (falta la llave de Binance en el servidor)');
 const a=E.acct(u),k=String(m.kind||'');if(!KINDS.includes(k))return err('Tipo de artículo no válido');
 const ps=String(m.price||'').trim().replace(',','.');if(!/^\d{1,5}(\.\d{1,2})?$/.test(ps))return err('Precio en USDT inválido (ej. 12.50)');const pc=Math.round(parseFloat(ps)*100);if(!(pc>=MIN_C&&pc<=MAX_C))return err('El precio debe estar entre 1.00 y 50000.00 USDT');
 const pay=String(m.pay||'').trim(),bn=String(m.bn||'').trim();
 if(!/^[\w@.+:\-]{4,64}$/.test(pay))return err('Escribe tu ID de Binance Pay (para pagarte los USDT)');
 if(!/^[\p{L}\p{N} _.@\-]{2,40}$/u.test(bn))return err('Escribe tu nombre de usuario de Binance');
 const p=prim(u);if(Object.values(U().o).filter(L=>prim(L.u)===p).length>=MAXL)return err('Máximo '+MAXL+' anuncios activos');
 const id='m'+E.rid(7),base={id,u,nm:nmOf(u),pc,pay,bn,ts:now(),st:'o',k};
 if(k==='gem'){const q=Math.floor(+m.q);if(!(q>=1&&q<=1e6))return err('Cantidad de gemas inválida');if(E.gTot(a)<q)return err('No tienes tantas gemas');
  if(!E.spendGems(a,q,false,'Puestas en el Mercado USDT'))return err('Saldo insuficiente');
  U().o[id]=Object.assign(base,{k:'g',q});E.pushEnt(u)}
 else{const r=MK.ops['offer.new'](u,Object.assign({},m,{kind:k,p:1}));if(!r||r.e)return r||err('No se pudo publicar');
  const o=DB.offers&&DB.offers[r.id];if(!o)return err('No se pudo publicar');
  delete DB.offers[r.id];try{S.bc('offers',r.id,o,null)}catch(e){}
  const q={};if(o.q)q.q=o.q;U().o[id]=Object.assign(base,{it:o.it,pet:o.pet,tk:o.tk,pv:o.pv,ec:o.ec,wh:o.wh},q,{k})}
 U().pf[p]={pay,bn};S.dirty();log('[mercado-usdt] '+nmOf(u)+' publica '+desc(U().o[id])+' por '+fmt(pc)+' USDT');
 return{ok:1,id,ent:E.ent(u)}};

ops['um.cancel']=(u,m)=>{sweep();const id=String(m.id||''),L=U().o[id];if(!L||prim(L.u)!==prim(u))return err('No es tu anuncio');if(L.st!=='o')return err('Alguien lo está pagando: espera unos minutos');
 if(L.k==='g'){const a=E.acct(L.u);a.gem.own+=L.q|0;E.glAdd(a,L.q|0,'Anuncio del Mercado USDT retirado');E.pushEnt(L.u)}else MK.giveBack(L);
 delete U().o[id];S.dirty();return{ok:1,ent:E.ent(u)}};

ops['um.buy']=(u,m)=>{sweep();if(!PY.on())return err('El mercado USDT aún no está activado');const id=String(m.id||''),L=U().o[id];if(!L)return err('Ese anuncio ya no existe');
 if(prim(L.u)===prim(u))return err('Es tu propio anuncio');if(L.st==='r'&&L.b&&prim(L.b)===prim(u)){const o=PY.get(L.oid);if(o&&o.st==='p')return Object.assign({ok:1,lid:id,d:desc(L)},PY.view(o))}
 if(L.st!=='o')return err('Alguien lo está pagando: espera unos minutos');if(hasActive(u))return err('Ya tienes un pago pendiente: termínalo o cancélalo primero');
 const r=PY.newMk(u,L.pc,id,L.k);if(r.e)return r;L.st='r';L.b=u;L.oid=r.o.id;S.dirty();
 inbox(L.u,'🏷️ Alguien está comprando «'+desc(L)+'» por '+fmt(L.pc)+' USDT','s');
 return Object.assign({ok:1,lid:id,d:desc(L)},r.v)};

ops['um.abort']=(u,m)=>{sweep();const L=Object.values(U().o).find(x=>x.id===String(m.id||'')&&x.st==='r'&&x.b&&prim(x.b)===prim(u));if(!L)return err('No hay un pago pendiente tuyo para ese anuncio');
 const o=PY.get(L.oid);if(o&&o.st==='paid')return err('Ese pago ya fue recibido');if(o&&o.st==='p'){o.st='exp';o.x=Math.min(o.x,now())}   /* su monto queda reservado un rato por si ya pagó */
 L.st='o';delete L.b;delete L.oid;S.dirty();return{ok:1}};

/* ---------- el pago llegó (lo llama pay.js) ---------- */
function onMk(o,tx){if(o.pk==='chm'){return CM&&CM.autoPaid(o,tx)}const d=U(),L=d.o[o.ref],bu=o.u,bnm=nmOf(bu);
 if(!L||(L.st==='r'&&L.b&&prim(L.b)!==prim(bu))){const sid='s'+E.rid(6);d.s[sid]={id:sid,bu,bnm,sn:'—',su:'',d:L?desc(L):'(anuncio ya no disponible)',c:Math.round(o.b*100),paid:o.c,fee:0,net:0,tx,t:now(),st:'refund'};S.dirty();
  inbox(bu,'⚠️ Recibimos tu pago de '+fmt(o.c)+' USDT pero el artículo ya no estaba disponible. Te lo reembolsaremos por Binance Pay.','b');
  try{S.notify('⚠️ SILK ROAD · REEMBOLSO NECESARIO\nPago recibido de '+bnm+': '+fmt(o.c)+' USDT (tx '+tx+')\nEl anuncio ya no estaba disponible. Devuélvele el pago por Binance Pay.')}catch(e){}
  return}
 const gross=L.pc,fee=Math.floor(gross*FEE_BPS/10000),net=gross-fee,dsc=desc(L);
 if(L.k==='g'){const b=E.acct(bu);b.gem.own+=L.q|0;E.glAdd(b,L.q|0,'Mercado USDT');E.pushEnt(bu)}else MK.deliverOffer(L,bu);
 delete d.o[L.id];
 const sid='s'+E.rid(6);d.s[sid]={id:sid,bu,bnm,su:L.u,sn:L.nm,d:dsc,c:gross,paid:o.c,fee,net,pay:L.pay,bn:L.bn,tx,t:now(),st:'due'};
 const keys=Object.keys(d.s);if(keys.length>600){keys.filter(x=>d.s[x].st==='paid').sort((a,b)=>d.s[a].t-d.s[b].t).slice(0,keys.length-500).forEach(x=>delete d.s[x])}
 S.dirty();
 inbox(bu,'🛒 ¡Pago confirmado! Recibiste «'+dsc+'» (pagaste '+fmt(o.c)+' USDT). Gracias por comprar.','b');
 inbox(L.u,'💰 Se vendió «'+dsc+'» por '+fmt(gross)+' USDT. Te pagaremos '+fmt(net)+' USDT (comisión 5%: '+fmt(fee)+') por Binance Pay a '+L.bn+' · ID '+L.pay+'.','s');
 S.log('[mercado-usdt] VENTA '+dsc+' · '+L.nm+' → '+bnm+' · '+fmt(gross)+' USDT · pagar '+fmt(net)+' a '+L.bn+' ('+L.pay+') · tx '+tx);
 try{S.notify('💵 SILK ROAD · VENTA EN EL MERCADO USDT (pago ya verificado)\nArtículo: '+dsc+'\nComprador: '+bnm+' pagó '+fmt(o.c)+' USDT (tx '+tx+')\nVendedor: '+L.nm+'\nPAGAR AL VENDEDOR: '+fmt(net)+' USDT (precio '+fmt(gross)+' − 5% = '+fmt(fee)+')\nBinance Pay ID: '+L.pay+'\nUsuario Binance: '+L.bn+'\nCuando pagues, márcalo en el juego: Mercado USDT → Master.')}catch(e){}}
PY.hooks.onMk=onMk;PY.hooks.onMkExp=()=>{try{sweep()}catch(e){}};
setInterval(()=>{try{sweep()}catch(e){}},60000);

/* ---------- buzón / mis operaciones ---------- */
ops['um.box']=(u)=>{sweep();const d=U(),p=prim(u),mine=Object.values(d.o).filter(L=>prim(L.u)===p).sort((a,b)=>b.ts-a.ts).map(L=>view(L,u));
 const act=hasActive(u);let buying=null;if(act){const o=PY.get(act.oid);if(o&&o.st==='p')buying=Object.assign({lid:act.id,d:desc(act)},PY.view(o))}
 const S2=Object.values(d.s);const buys=S2.filter(x=>prim(x.bu)===p).sort((a,b)=>b.t-a.t).slice(0,30).map(x=>({d:x.d,paid:x.paid/100,t:x.t,st:x.st}));
 const sales=S2.filter(x=>x.su&&prim(x.su)===p).sort((a,b)=>b.t-a.t).slice(0,30).map(x=>({d:x.d,gross:x.c/100,net:x.net/100,fee:x.fee/100,t:x.t,st:x.st}));
 return{ok:1,msgs:(d.bx[p]||[]).slice(0,60),mine,buying,buys,sales,pf:d.pf[p]||null,on:PY.on(),pid:PY.PAY_ID,adm:S.isMaster(u)?1:0,fee:FEE_BPS/100}};

/* ---------- master: pagos a vendedores ---------- */
const gm=u=>S.isMaster(u)?null:err('Solo el master');
ops['um.adm']=(u)=>{const x=gm(u);if(x)return x;const l=Object.values(U().s).filter(y=>y.st==='due'||y.st==='refund').sort((a,b)=>a.t-b.t).map(y=>({id:y.id,st:y.st,d:y.d,sn:y.sn,pay:y.pay||'',bn:y.bn||'',net:y.net/100,gross:y.c/100,fee:y.fee/100,bnm:y.bnm,paid:y.paid/100,t:y.t,tx:y.tx}));
 const done=Object.values(U().s).filter(y=>y.st==='paid').sort((a,b)=>b.pt-a.pt).slice(0,8).map(y=>({d:y.d,sn:y.sn,net:y.net/100,t:y.pt}));return{ok:1,l,done}};
ops['um.paid']=(u,m)=>{const x=gm(u);if(x)return x;const y=U().s[String(m.id||'')];if(!y||(y.st!=='due'&&y.st!=='refund'))return err('Ya estaba marcado o no existe');
 const was=y.st;y.st='paid';y.pt=now();S.dirty();
 if(was==='due'&&y.su)inbox(y.su,'💵 ¡Te pagamos '+fmt(y.net)+' USDT por la venta de «'+y.d+'»! Revisa tu Binance. Gracias.','s');else if(was==='refund')inbox(y.bu,'💵 Te reembolsamos '+fmt(y.paid)+' USDT por Binance Pay.','b');
 S.log('[mercado-usdt] '+(was==='due'?'pagado al vendedor ':'reembolsado a ')+(y.sn||y.bnm)+' '+fmt(was==='due'?y.net:y.paid)+' USDT');return{ok:1}};
return{ops,onMk,sweep}};
