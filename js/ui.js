// ---- DATOS EN LA NUBE ----
async function loadData(){
  var {data}=await sb.from('datos_app').select('datos').eq('user_id',currentUser.id).single();
  DB = data ? (data.datos||[]) : [];
}

async function save(){
  await sb.from('datos_app').update({datos:DB, updated_at:new Date().toISOString()}).eq('user_id',currentUser.id);
}

// ---- UI HELPERS ----
function toast(msg){var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2400);}
function openModal(html,cb){document.getElementById('modal-body').innerHTML=html;document.getElementById('modal').classList.add('open');if(cb)setTimeout(cb,30);}
function closeModal(){document.getElementById('modal').classList.remove('open');}
document.getElementById('modal').addEventListener('click',function(e){if(e.target===e.currentTarget)closeModal();});
function ini(n,a){return((a||'')[0]||'').toUpperCase()+((n||'')[0]||'').toUpperCase();}
function isoDate(d){return d.toISOString().split('T')[0];}
function fmtFecha(iso){if(!iso)return'';var p=iso.split('-');return parseInt(p[2])+'/'+parseInt(p[1])+'/'+p[0];}
function getISO(cl){
  if(cl.fechaISO&&cl.fechaISO.match(/^\d{4}-\d{2}-\d{2}$/))return cl.fechaISO;
  var yr=new Date().getFullYear(),p=(cl.fecha||'').split('/');
  if(p.length<2)return null;
  return yr+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0');
}
function getEstado(cl){return cl.estado||'';}
function claseValida(cl){var e=getEstado(cl);return e!=='F'&&e!=='P';}
function notaBadge(n){
  if(n===null)return{cls:'nb-em',txt:'--'};
  return{cls:n>=NOTA_APROBADO?'nb-ok':'nb-bad',txt:n.toFixed(1)};
}
function confirmar(msg,onOk){
  openModal('<div style="text-align:center;padding:8px 0 4px"><div style="font-size:15px;margin-bottom:18px">'+msg+'</div><div style="display:flex;gap:8px"><button class="btn btn-block btn-danger" style="margin-top:0" id="cok">Eliminar</button><button class="btn btn-block" style="margin-top:0" id="cno">Cancelar</button></div></div>');
  document.getElementById('cok').addEventListener('click',function(){closeModal();onOk();});
  document.getElementById('cno').addEventListener('click',closeModal);
}

// ---- NAVEGACION ----
function go(screen){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  document.getElementById('s-'+screen).classList.add('active');
  curScreen=screen;updateHeader();
  if(screen==='cursos')renderCursos();
  if(screen==='curso')renderTab(curTab);
  if(screen==='clase')renderClase();
}
function updateHeader(){
  var back=document.getElementById('backBtn'),title=document.getElementById('hdrTitle'),act=document.getElementById('hdrAct'),fab=document.getElementById('fab'),fabGear=document.getElementById('fab-gear');
  fab.style.display='none';fabGear.style.display='none';
  if(curScreen==='cursos'){
    back.style.display='none';title.textContent='Mis Cursos';act.style.display='none';fab.style.display='flex';
  } else if(curScreen==='curso'){
    var c=DB[ci];back.style.display='block';title.textContent=c.nombre;
    act.style.display='block';act.textContent='...';act.onclick=menuCurso;
    back.onclick=function(){go('cursos');};
    if(curTab==='alumnos'||curTab==='examenes'){fab.style.display='flex';}
    else if(curTab==='clases'){fabGear.style.display='flex';}
  } else if(curScreen==='clase'){
    var cl=DB[ci].clases[li];back.style.display='block';title.textContent='Clase '+cl.fecha;
    act.style.display='block';act.textContent='Guardar';
    act.onclick=function(){save();toast('Guardado');go('curso');};
    back.onclick=function(){go('curso');};
  }
}
function swTab(tab,el){
  curTab=tab;
  document.querySelectorAll('#curso-tabs .tab').forEach(function(t){t.classList.remove('active');});
  el.classList.add('active');
  ALL_TABS.forEach(function(t){document.getElementById('tab-'+t).style.display=t===tab?'block':'none';});
  updateHeader();renderTab(tab);
}

