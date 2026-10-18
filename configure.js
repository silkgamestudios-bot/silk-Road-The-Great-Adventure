/* Configura todo con UN comando:
   node tools/configure.js --server wss://TU-APP.onrender.com --google XXXX.apps.googleusercontent.com --site https://TU-SITIO.netlify.app --email tu@gmail.com
   Escribe client/config.js y rellena render.yaml (ALLOWED_ORIGINS, MASTER_EMAIL, GOOGLE_CLIENT_ID). */
const fs=require('fs'),path=require('path');const a=process.argv.slice(2),g=k=>{const i=a.indexOf('--'+k);return i<0?'':a[i+1]};
const server=g('server'),google=g('google'),site=g('site'),email=g('email');
if(!server||!site){console.log('Uso: node tools/configure.js --server wss://xxx.onrender.com --site https://xxx.netlify.app [--google ID] [--email tu@gmail.com]');process.exit(1)}
if(!/^wss:\/\//.test(server)){console.log('El servidor debe empezar con wss://');process.exit(1)}
const root=path.join(__dirname,'..');
fs.writeFileSync(path.join(root,'client/config.js'),`/* Configuración del sitio (generada por tools/configure.js) */\nwindow.SR_CFG={\n server:'${server}',\n googleClientId:'${google}'\n};\n`);
let y=fs.readFileSync(path.join(root,'render.yaml'),'utf8');
const setv=(k,v)=>{const r=new RegExp('(- key: '+k+'\\n\\s+value: )"[^"]*"');y=y.replace(r,'$1"'+v+'"')};
setv('ALLOWED_ORIGINS',site.replace(/\/$/,''));if(google)setv('GOOGLE_CLIENT_ID',google);if(email)setv('MASTER_EMAIL',email);
fs.writeFileSync(path.join(root,'render.yaml'),y);
console.log('✔ client/config.js y render.yaml listos.\nFalta (solo en Render, son secretos): CALLMEBOT_KEY');
