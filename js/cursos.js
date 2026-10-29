// ---- RENDER ----
function renderCursos(){
  var el=document.getElementById('cursos-list');
  var q=(document.getElementById('search-cursos')?document.getElementById('search-cursos').value:'').toLowerCase().trim();
  var lista=DB.filter(function(c){return !q||(c.nombre+' '+c.institucion+' '+c.materia).toLowerCase().indexOf(q)>=0;});
  if(!DB.length){el.innerHTML='<div class="empty">No hay cursos aun.<br>Toca + para crear el primero.</div>';return;}
  if(!lista.length){el.innerHTML='<div class="empty">No se encontraron cursos.</div>';return;}
  var html='';
  lista.forEach(function(c){
    var i=DB.indexOf(c);
    html+='<div class="cc" data-i="'+i+'"><div style="font-weight:600;font-size:16px;margin-bottom:3px">'+c.nombre+'</div><div style="font-size:13px;color:var(--txt2)">'+c.institucion+' &middot; '+c.materia+'</div><span class="badge">'+c.alumnos.length+' alumnos &middot; '+c.clases.length+' clases</span></div>';
  });
  el.innerHTML=html;
  document.querySelectorAll('.cc').forEach(function(el){el.addEventListener('click',function(){openCurso(parseInt(this.getAttribute('data-i')));});});
}
function openCurso(i){
  ci=i;curTab='alumnos';curCuat=0;curMes=-1;
  document.querySelectorAll('#curso-tabs .tab').forEach(function(t,idx){t.classList.toggle('active',idx===0);});
  ALL_TABS.forEach(function(t,idx){document.getElementById('tab-'+t).style.display=idx===0?'block':'none';});
  go('curso');
}
function renderTab(tab){
  if(tab==='alumnos')renderAlumnos();
  if(tab==='clases')renderClases();
  if(tab==='stats')renderStats();
  if(tab==='examenes')renderExamenes();
  if(tab==='resumen')renderResumen();
}
function renderAlumnos(){
  var c=DB[ci],el=document.getElementById('tab-alumnos');
  if(!c.alumnos.length){el.innerHTML='<div class="empty">Sin alumnos aun.<br>Toca + para agregar.</div>';return;}
  var html='';
  c.alumnos.forEach(function(a,i){html+='<div class="arow"><div class="av">'+ini(a.nombre,a.apellido)+'</div><div style="flex:1;font-size:15px">'+a.apellido+', '+a.nombre+'</div><button class="btn btn-sm btn-danger" data-di="'+i+'">Borrar</button></div>';});
  el.innerHTML=html;
  document.querySelectorAll('[data-di]').forEach(function(btn){btn.addEventListener('click',function(){var i=parseInt(this.getAttribute('data-di'));var a=DB[ci].alumnos[i];confirmar('Eliminar a '+a.apellido+', '+a.nombre+'?',function(){DB[ci].alumnos.splice(i,1);save();renderAlumnos();toast('Alumno eliminado');});});});
}
function renderClases(){
  var c=DB[ci],el=document.getElementById('tab-clases');
  if(!c.clases.length){el.innerHTML='<div class="empty">Sin clases configuradas.<br>Toca el icono &#9881; para configurar los dias.</div>';return;}
  var mesesC=curCuat===0?MESES_C1:MESES_C2;
  var mesesConClases=mesesC.filter(function(m){return c.clases.some(function(cl){var iso=getISO(cl);return iso&&parseInt(iso.split('-')[1])-1===m;});});
  var tabsHtml='<div class="tabs1" style="margin-bottom:10px"><button class="tab '+(curCuat===0?'active':'')+'" id="ctab0">1er cuatrimestre</button><button class="tab '+(curCuat===1?'active':'')+'" id="ctab1">2do cuatrimestre</button></div>';
  if(!mesesConClases.length){
    el.innerHTML=tabsHtml+'<div class="empty">Sin clases en este cuatrimestre.</div>';
    document.getElementById('ctab0').addEventListener('click',function(){curCuat=0;curMes=-1;renderClases();});
    document.getElementById('ctab1').addEventListener('click',function(){curCuat=1;curMes=-1;renderClases();});
    return;
  }
  if(curMes<0||mesesConClases.indexOf(curMes)<0)curMes=mesesConClases[0];
  var mesTabsHtml='<div class="tabs2" id="mes-tabs">';
  mesesConClases.forEach(function(m){mesTabsHtml+='<button class="tab2 '+(m===curMes?'active':'')+'" data-m="'+m+'">'+MESES[m].substring(0,3)+'</button>';});
  mesTabsHtml+='</div>';
  el.innerHTML=tabsHtml+mesTabsHtml+'<div id="clases-mes"></div>';
  document.getElementById('ctab0').addEventListener('click',function(){curCuat=0;curMes=-1;renderClases();});
  document.getElementById('ctab1').addEventListener('click',function(){curCuat=1;curMes=-1;renderClases();});
  document.querySelectorAll('#mes-tabs .tab2').forEach(function(btn){btn.addEventListener('click',function(){curMes=parseInt(this.getAttribute('data-m'));renderClases();});});
  var clasesMes=c.clases.filter(function(cl){var iso=getISO(cl);return iso&&parseInt(iso.split('-')[1])-1===curMes;});
  var cMesEl=document.getElementById('clases-mes');
  if(!clasesMes.length){cMesEl.innerHTML='<div class="empty">Sin clases en este mes.</div>';return;}
  var html='';
  clasesMes.forEach(function(cl){
    var realIdx=c.clases.indexOf(cl),estado=getEstado(cl);
    var pillClass='pill-pend',pillTxt='Pendiente';
    if(estado==='F'){pillClass='pill-fer';pillTxt='Feriado';}
    else if(estado==='P'){pillClass='pill-par';pillTxt='Paro';}
    else if(cl.asistencia&&Object.values(cl.asistencia).some(function(v){return v==='P'||v==='A';})){pillClass='pill-ok';pillTxt='Tomada';}
    html+='<div class="clase-row" data-ri="'+realIdx+'"><div><div style="font-weight:600">'+cl.fecha+'</div><div style="font-size:12px;color:var(--txt2)">'+(cl.diaNombre||'')+(cl.hora?' &middot; '+cl.hora:'')+'</div></div><span class="pill '+pillClass+'">'+pillTxt+'</span></div>';
  });
  cMesEl.innerHTML=html;
  document.querySelectorAll('.clase-row').forEach(function(row){row.addEventListener('click',function(){openClase(parseInt(this.getAttribute('data-ri')));});});
}
function getDefaultDesde(){var c=DB[ci];if(c&&c.cuatri&&c.cuatri.c1i)return c.cuatri.c1i;return new Date().getFullYear()+'-03-01';}
function renderStats(){
  var c=DB[ci],el=document.getElementById('tab-stats');
  if(!c.alumnos.length||!c.clases.length){el.innerHTML='<div class="empty">Necesitas alumnos y clases para ver estadisticas.</div>';return;}
  el.innerHTML='<div style="background:var(--bg);border:0.5px solid var(--brd);border-radius:var(--radius-lg);padding:14px;margin-bottom:14px"><div style="font-size:13px;font-weight:600;color:var(--txt2);margin-bottom:8px">Periodo a evaluar</div><div class="date-row"><div class="df"><label>Desde</label><input type="date" id="sd" value="'+getDefaultDesde()+'"></div><div class="df"><label>Hasta</label><input type="date" id="sh" value="'+isoDate(new Date())+'"></div></div><button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%" id="calc-btn">Calcular</button></div><div id="stats-out"></div>';
  document.getElementById('calc-btn').addEventListener('click',calcStats);
  calcStats();
}
function calcStats(){
  var c=DB[ci],desde=document.getElementById('sd')?document.getElementById('sd').value:null,hasta=document.getElementById('sh')?document.getElementById('sh').value:null,out=document.getElementById('stats-out');
  if(!desde||!hasta||!out)return;
  var enRango=c.clases.filter(function(cl){var iso=getISO(cl);return iso&&iso>=desde&&iso<=hasta;});
  var validas=enRango.filter(function(cl){return claseValida(cl);});
  var total=validas.length,ferPar=enRango.length-total;
  if(!total){out.innerHTML='<div class="empty">No hay clases validas en ese periodo.'+(ferPar>0?'<br><br>'+ferPar+' excluida(s) por feriado/paro.':'')+'</div>';return;}
  var html='';
  c.alumnos.forEach(function(a){
    var pres=validas.filter(function(cl){return (cl.asistencia||{})[a.id]==='P';}).length;
    var pct=Math.round((pres/total)*100),ok=pct>=75;
    html+='<div class="stat-row"><div class="av">'+ini(a.nombre,a.apellido)+'</div><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:600;margin-bottom:4px">'+a.apellido+', '+a.nombre+'</div><div class="bar-wrap"><div class="bar-fill" style="width:'+pct+'%;background:'+(ok?'#3B6D11':'#A32D2D')+'"></div></div><div style="font-size:11px;color:var(--txt2);margin-top:3px">'+pres+' de '+total+' clases</div></div><div class="stat-pct '+(ok?'pct-ok':'pct-bad')+'">'+pct+'%</div></div>';
  });
  out.innerHTML='<div class="info-box">'+total+' clase(s) validas'+(ferPar>0?' &middot; '+ferPar+' excluida(s)':'')+' &middot; Verde = 75% o mas</div>'+html;
}
function renderResumen(){
  var c=DB[ci],el=document.getElementById('tab-resumen');
  if(!c.alumnos.length){el.innerHTML='<div class="empty">Sin alumnos en este curso.</div>';return;}
  var todasValidas=c.clases.filter(function(cl){return claseValida(cl);});
  var html='';
  c.alumnos.forEach(function(a,ai){
    var pres=todasValidas.filter(function(cl){return (cl.asistencia||{})[a.id]==='P';}).length;
    var totalCl=todasValidas.length,pct=totalCl>0?Math.round((pres/totalCl)*100):null,pctOk=pct!==null&&pct>=75;
    var examenes=c.examenes||[];
    var notasValidas=examenes.filter(function(ex){var n=(ex.notas||{})[a.id];return n!==undefined&&n!==''&&!isNaN(parseFloat(n));});
    var promedio=null;
    if(notasValidas.length>0){var suma=notasValidas.reduce(function(s,ex){return s+parseFloat((ex.notas||{})[a.id]);},0);promedio=suma/notasValidas.length;}
    var promOk=promedio!==null&&promedio>=NOTA_APROBADO;
    var ac=pct===null?'var(--txt2)':pctOk?'var(--suc)':'var(--dan)';
    var pc=promedio===null?'var(--txt2)':promOk?'var(--suc)':'var(--dan)';
    var at=pct!==null?'<span style="color:'+ac+'">Asist. '+pct+'%</span>':'<span style="color:var(--txt2)">Sin clases</span>';
    var pt=promedio!==null?'<span style="color:'+pc+'">Prom. '+promedio.toFixed(1)+'</span>':'<span style="color:var(--txt2)">Sin notas</span>';
    var detalleEx='';
    if(examenes.length){
      detalleEx='<div style="font-size:12px;font-weight:600;color:var(--txt2);margin:8px 0 6px">Detalle por examen</div>';
      examenes.forEach(function(ex){var nota=(ex.notas||{})[a.id];var n=nota!==undefined&&nota!==''?parseFloat(nota):null;var b=notaBadge(n);detalleEx+='<div class="ex-row"><div><div style="font-size:14px">'+ex.nombre+'</div>'+(ex.fecha?'<div style="font-size:11px;color:var(--txt2)">'+ex.fecha+'</div>':'')+'</div><span class="nota-b '+b.cls+'">'+b.txt+'</span></div>';});
    } else {detalleEx='<div style="font-size:13px;color:var(--txt2)">Sin examenes cargados.</div>';}
    html+='<div class="alumno-card"><div class="alumno-card-hdr" data-ai="'+ai+'"><div class="av">'+ini(a.nombre,a.apellido)+'</div><div style="flex:1"><div style="font-weight:600;font-size:15px">'+a.apellido+', '+a.nombre+'</div><div style="font-size:12px;margin-top:2px;display:flex;gap:10px">'+at+pt+'</div></div><span style="color:var(--txt2);font-size:18px" id="rarr-'+ai+'">+</span></div><div class="alumno-card-body" id="abody-'+ai+'"><div class="resumen-grid"><div class="resumen-metric"><div class="resumen-metric-label">Asistencia</div><div class="resumen-metric-value" style="color:'+ac+'">'+(pct!==null?pct+'%':'--')+'</div>'+(totalCl>0?'<div style="font-size:11px;color:var(--txt2);margin-top:3px">'+pres+' de '+totalCl+' clases</div>':'')+'</div><div class="resumen-metric"><div class="resumen-metric-label">Promedio</div><div class="resumen-metric-value" style="color:'+pc+'">'+(promedio!==null?promedio.toFixed(1):'--')+'</div>'+(notasValidas.length>0?'<div style="font-size:11px;color:var(--txt2);margin-top:3px">'+notasValidas.length+' examen(es)</div>':'')+'</div></div>'+detalleEx+'</div></div>';
  });
  el.innerHTML=html;
  document.querySelectorAll('.alumno-card-hdr').forEach(function(hdr){hdr.addEventListener('click',function(){var ai=parseInt(this.getAttribute('data-ai'));var body=document.getElementById('abody-'+ai),arr=document.getElementById('rarr-'+ai);var open=body.style.display==='block';body.style.display=open?'none':'block';arr.textContent=open?'+':'-';});});
}
function openClase(i){li=i;go('clase');}
function renderClase(){
  var c=DB[ci],cl=c.clases[li],el=document.getElementById('clase-content');
  var estado=getEstado(cl);
  var banner=estado==='F'?'<div style="background:var(--war-bg);color:var(--war);border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;font-size:14px;font-weight:600">Marcada como Feriado -- no cuenta para asistencia.</div>':estado==='P'?'<div style="background:var(--neu-bg);color:var(--neu);border-radius:var(--radius);padding:10px 14px;margin-bottom:12px;font-size:14px;font-weight:600">Marcada como Paro Docente -- no cuenta para asistencia.</div>':'';
  var listHtml='';
  if(!estado){
    listHtml='<div id="asist-list">';
    c.alumnos.forEach(function(a){var val=(cl.asistencia||{})[a.id]||'';listHtml+='<div class="asist-row"><div class="av">'+ini(a.nombre,a.apellido)+'</div><div style="flex:1;font-size:14px">'+a.apellido+', '+a.nombre+'</div><div style="display:flex;gap:6px"><button class="ab '+(val==='P'?'aP':'')+'" data-aid="'+a.id+'" data-val="P">P</button><button class="ab '+(val==='A'?'aA':'')+'" data-aid="'+a.id+'" data-val="A">A</button></div></div>';});
    listHtml+='</div>';
  }
  el.innerHTML=banner+'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px"><button class="btn btn-sm" id="btn-tp" style="background:var(--suc-bg);color:var(--suc);border-color:var(--suc)">Todos presentes</button><button class="btn btn-sm btn-danger" id="btn-ta">Todos ausentes</button><button class="btn btn-sm '+(estado==='F'?'btn-warn':'btn-neu')+'" id="btn-fer">'+(estado==='F'?'Quitar feriado':'Feriado')+'</button><button class="btn btn-sm '+(estado==='P'?'btn-warn':'btn-neu')+'" id="btn-par">'+(estado==='P'?'Quitar paro':'Paro Docente')+'</button></div>'+listHtml;
  if(!estado&&!c.alumnos.length){document.getElementById('asist-list').innerHTML='<div class="empty">No hay alumnos en este curso.</div>';}
  document.getElementById('btn-tp').addEventListener('click',function(){setAll('P');});
  document.getElementById('btn-ta').addEventListener('click',function(){setAll('A');});
  document.getElementById('btn-fer').addEventListener('click',function(){setEstado('F');});
  document.getElementById('btn-par').addEventListener('click',function(){setEstado('P');});
  document.querySelectorAll('.ab').forEach(function(btn){btn.addEventListener('click',function(){var aid=this.getAttribute('data-aid'),val=this.getAttribute('data-val');var cl2=DB[ci].clases[li];if(!cl2.asistencia)cl2.asistencia={};cl2.asistencia[aid]=val;save();document.querySelectorAll('.ab[data-aid="'+aid+'"]').forEach(function(b){b.className='ab'+(b.getAttribute('data-val')===val?(val==='P'?' aP':' aA'):'');});});});
}
function setAll(val){var c=DB[ci],cl=c.clases[li];cl.estado='';if(!cl.asistencia)cl.asistencia={};c.alumnos.forEach(function(a){cl.asistencia[a.id]=val;});save();renderClase();}
function setEstado(est){var cl=DB[ci].clases[li];cl.estado=cl.estado===est?'':est;if(cl.estado)cl.asistencia={};save();renderClase();}
function fabClick(){
  if(curScreen==='cursos')modalNuevoCurso();
  else if(curScreen==='curso'&&curTab==='alumnos')modalOpcionesAlumnos();
  else if(curScreen==='curso'&&curTab==='examenes')modalNuevoExamen();
}
function modalOpcionesAlumnos(){
  openModal('<div style="font-size:16px;font-weight:600;margin-bottom:16px">Agregar alumnos</div><button class="opcion-btn" id="op-uno"><div class="opcion-icon">&#128100;</div><div><div style="font-weight:600">Agregar uno por uno</div><div style="font-size:13px;color:var(--txt2)">Ingresar nombre y apellido</div></div></button><button class="opcion-btn" id="op-lista"><div class="opcion-icon">&#128203;</div><div><div style="font-weight:600">Importar lista</div><div style="font-size:13px;color:var(--txt2)">Pegar desde Excel o Word</div></div></button>');
  document.getElementById('op-uno').addEventListener('click',function(){closeModal();modalNuevoAlumno();});
  document.getElementById('op-lista').addEventListener('click',function(){closeModal();modalImportar();});
}
function menuCurso(){
  openModal('<div style="font-size:16px;font-weight:600;margin-bottom:16px">'+DB[ci].nombre+'</div><button class="btn btn-block" id="m-pdf">Reporte de asistencia (PDF)</button><button class="btn btn-block" id="m-dias">Configurar dias de clase</button><div class="divider"></div><button class="btn btn-block btn-danger" id="m-del">Eliminar curso</button>');
  document.getElementById('m-pdf').addEventListener('click',function(){closeModal();modalReporte();});
  document.getElementById('m-dias').addEventListener('click',function(){closeModal();modalDias();});
  document.getElementById('m-del').addEventListener('click',function(){closeModal();confirmar('Eliminar '+DB[ci].nombre+' y todos sus datos?',function(){DB.splice(ci,1);save();go('cursos');toast('Curso eliminado');});});
}

