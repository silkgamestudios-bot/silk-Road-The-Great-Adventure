#!/usr/bin/env python3
"""Aplica los cambios de Silk Road v404-v409 a OTRO play.html.
Uso:  python3 aplicar_cambios.py  ruta/a/tu/play.html  salida.html
Cada cambio se busca por texto exacto. Si no lo encuentra (porque ese codigo ya fue
modificado en tu version) lo lista como FALLO para resolverlo a mano; no rompe nada."""
import json,sys,os
here=os.path.dirname(os.path.abspath(__file__))
src,dst=sys.argv[1],sys.argv[2]
t=open(src,encoding='utf8').read()
H=json.load(open(os.path.join(here,'cambios_play_html.json'),encoding='utf8'))
bloque=open(os.path.join(here,'bloque_nuevo.js'),encoding='utf8').read()
ok=fa=am=0
for i,h in enumerate(H):
    if h['tipo']=='bloque':
        if bloque[:60] in t:print('[%02d] bloque ya aplicado'%i);continue
        c=t.count(h['anchor'])
        if c!=1:print('[%02d] FALLO bloque (ancla encontrada %d veces)'%(i,c));fa+=1;continue
        t=t.replace(h['anchor'],bloque+h['anchor']);ok+=1;continue
    if h['new'] and h['new'] in t:
        print('[%02d] ya aplicado'%i);continue
    c=t.count(h['old'])
    if c==1:t=t.replace(h['old'],h['new']);ok+=1
    elif c==0:
        if h['new'] and t.count(h['new'])>=1:print('[%02d] ya aplicado (linea ~%s)'%(i,h.get('linea')))
        else:print('[%02d] FALLO: no se encontro el texto (linea ~%s) -> %r'%(i,h.get('linea'),h['old'][:90]));fa+=1
    else:print('[%02d] AMBIGUO (%d coincidencias) linea ~%s'%(i,c,h.get('linea')));am+=1
open(dst,'w',encoding='utf8').write(t)
print('\nAplicados: %d · Fallos: %d · Ambiguos: %d'%(ok,fa,am))
print('Recuerda copiar tambien: assets/hn_ena.png (a la raiz) y servidor/economy.js (o aplicar su cambio: agregar fr1..fr8 al inicio de la lista MNK).')
