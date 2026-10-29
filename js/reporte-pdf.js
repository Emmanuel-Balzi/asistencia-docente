// ---- REPORTE PDF ----
function modalReporte(){
  var c=DB[ci];
  if(!c.alumnos.length||!c.clases.length){toast('Necesitas alumnos y clases cargados');return;}
  openModal('<div style="font-size:16px;font-weight:600;margin-bottom:6px">Reporte de asistencia</div>'
    +'<div style="font-size:13px;color:var(--txt2);margin-bottom:14px;line-height:1.5">Se genera un PDF en tabla con los alumnos, las fechas y P (presente) o A (ausente).</div>'
    +'<div class="date-row" style="margin-bottom:14px"><div class="df"><label>Desde</label><input type="date" id="rp-d" value="'+getDefaultDesde()+'"></div><div class="df"><label>Hasta</label><input type="date" id="rp-h" value="'+isoDate(new Date())+'"></div></div>'
    +'<button class="btn btn-primary btn-block" id="rp-ok">Descargar PDF</button>'
    +'<button class="btn btn-block" style="margin-top:8px" id="rp-cx">Cancelar</button>');
  document.getElementById('rp-ok').addEventListener('click',function(){
    var d=document.getElementById('rp-d').value,h=document.getElementById('rp-h').value;
    if(!d||!h){toast('Completa las fechas');return;}
    if(d>h){toast('La fecha Desde es posterior a Hasta');return;}
    generarPDF(d,h);
  });
  document.getElementById('rp-cx').addEventListener('click',closeModal);
}

function generarPDF(desde,hasta){
  if(!window.jspdf||!window.jspdf.jsPDF){toast('No se pudo cargar el generador de PDF. Revisa tu conexion.');return;}
  var c=DB[ci];
  var clases=c.clases.filter(function(cl){var iso=getISO(cl);return iso&&iso>=desde&&iso<=hasta;});
  clases.sort(function(a,b){return getISO(a)<getISO(b)?-1:1;});
  if(!clases.length){toast('No hay clases en ese periodo');return;}

  var jsPDF=window.jspdf.jsPDF;
  var doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});

  var head=['Alumno','Pres.','Aus.'];
  clases.forEach(function(cl){
    var iso=getISO(cl).split('-');
    head.push(iso[2]+'/'+iso[1]+'\n'+(cl.diaNombre||''));
  });

  var validas=clases.filter(function(cl){return claseValida(cl);});
  var body=[];
  c.alumnos.forEach(function(a){
    var pres=0,aus=0,fila=[];
    clases.forEach(function(cl){
      var est=getEstado(cl),v='';
      if(est==='F')v='F';
      else if(est==='P')v='Paro';
      else{
        var x=(cl.asistencia||{})[a.id];
        if(x==='P'){v='P';pres++;}
        else if(x==='A'){v='A';aus++;}
      }
      fila.push(v);
    });
    body.push([a.apellido+', '+a.nombre,String(pres),String(aus)].concat(fila));
  });

  var periodoTxt=fmtFecha(desde)+' al '+fmtFecha(hasta);
  var colStyles={0:{cellWidth:46,halign:'left'},1:{cellWidth:9,halign:'center'},2:{cellWidth:9,halign:'center'}};
  for(var i=3;i<head.length;i++){colStyles[i]={cellWidth:7,halign:'center'};}

  doc.autoTable({
    head:[head],
    body:body,
    startY:30,
    margin:{top:30,left:8,right:8,bottom:14},
    theme:'grid',
    styles:{fontSize:7,cellPadding:{top:1.2,bottom:1.2,left:0.6,right:0.6},lineColor:[200,200,200],lineWidth:0.2,valign:'middle'},
    headStyles:{fillColor:[24,95,165],textColor:255,halign:'center',fontSize:5.5,cellPadding:0.6},
    columnStyles:colStyles,
    horizontalPageBreak:true,
    horizontalPageBreakRepeat:0,
    didParseCell:function(d){
      if(d.section!=='body')return;
      if(d.column.index<3)return;
      var v=d.cell.raw;
      if(v==='P'){d.cell.styles.fillColor=[234,243,222];d.cell.styles.textColor=[39,80,10];d.cell.styles.fontStyle='bold';}
      else if(v==='A'){d.cell.styles.fillColor=[252,235,235];d.cell.styles.textColor=[121,31,31];d.cell.styles.fontStyle='bold';}
      else if(v==='F'||v==='Paro'){d.cell.styles.fillColor=[241,239,232];d.cell.styles.textColor=[99,56,6];d.cell.styles.fontSize=4.5;}
    },
    didDrawPage:function(){
      doc.setTextColor(26,26,24);
      doc.setFontSize(14);doc.setFont('helvetica','bold');
      doc.text('Registro de asistencia - '+c.nombre,10,14);
      doc.setFontSize(10);doc.setFont('helvetica','normal');
      doc.text((c.institucion||'')+' - '+(c.materia||''),10,20);
      doc.text('Periodo: '+periodoTxt,10,25.5);
      doc.setFontSize(8);doc.setTextColor(120,120,120);
      var h=doc.internal.pageSize.getHeight();
      doc.text('P = Presente   A = Ausente   F = Feriado   Paro = Paro docente (F y Paro no cuentan en Pres./Aus.)',10,h-8);
      doc.text('Registro del Docente - EB Solutions',doc.internal.pageSize.getWidth()-10,h-8,{align:'right'});
    }
  });

  var nombre=('Asistencia_'+c.nombre+'_'+desde+'_'+hasta).replace(/[^A-Za-z0-9_\-]+/g,'_')+'.pdf';
  doc.save(nombre);
  closeModal();
  toast('PDF generado');
}

function modalNuevoCurso(){
  openModal('<div style="font-size:16px;font-weight:600;margin-bottom:16px">Nuevo curso</div><div class="field-app"><label>Nombre del curso</label><input id="nc-n" placeholder="Ej: 3 A"></div><div class="field-app"><label>Institucion</label><input id="nc-i" placeholder="Ej: Escuela N 5"></div><div class="field-app"><label>Materia</label><input id="nc-m" placeholder="Ej: Matematica"></div><button class="btn btn-primary btn-block" id="nc-ok">Crear</button><button class="btn btn-block" style="margin-top:8px" id="nc-cx">Cancelar</button>');
  document.getElementById('nc-ok').addEventListener('click',crearCurso);
  document.getElementById('nc-cx').addEventListener('click',closeModal);
  setTimeout(function(){var el=document.getElementById('nc-n');if(el)el.focus();},80);
}
function crearCurso(){
  var n=document.getElementById('nc-n').value.trim(),ins=document.getElementById('nc-i').value.trim(),m=document.getElementById('nc-m').value.trim();
  if(!n||!ins||!m){toast('Completa todos los campos');return;}
  DB.push({id:Date.now(),nombre:n,institucion:ins,materia:m,alumnos:[],clases:[],diasHoras:[],examenes:[]});
  save();closeModal();renderCursos();toast('Curso creado');
}
function modalNuevoAlumno(){
  openModal('<div style="font-size:16px;font-weight:600;margin-bottom:16px">Agregar alumno</div><div class="field-app"><label>Apellido</label><input id="na-a" placeholder="Gonzalez"></div><div class="field-app"><label>Nombre</label><input id="na-n" placeholder="Maria"></div><button class="btn btn-primary btn-block" id="na-ok">Agregar</button><button class="btn btn-block" style="margin-top:8px" id="na-cx">Cancelar</button>');
  document.getElementById('na-ok').addEventListener('click',agregarAlumno);
  document.getElementById('na-cx').addEventListener('click',closeModal);
  setTimeout(function(){var el=document.getElementById('na-a');if(el)el.focus();},80);
}
function agregarAlumno(){
  var a=document.getElementById('na-a').value.trim(),n=document.getElementById('na-n').value.trim();
  if(!a||!n){toast('Completa nombre y apellido');return;}
  DB[ci].alumnos.push({id:'a'+Date.now()+Math.floor(Math.random()*9999),nombre:n,apellido:a});
  DB[ci].alumnos.sort(function(x,y){return x.apellido.localeCompare(y.apellido,'es');});
  save();closeModal();renderAlumnos();toast('Alumno agregado');
}
function modalImportar(){
  openModal('<div style="font-size:16px;font-weight:600;margin-bottom:8px">Importar lista</div><div style="font-size:13px;color:var(--txt2);margin-bottom:10px;line-height:1.5">Un alumno por linea. Formato: Apellido, Nombre o Apellido Nombre</div><div class="field-app"><textarea id="imp-txt" placeholder="Gonzalez Maria\nLopez Juan"></textarea></div><button class="btn btn-primary btn-block" id="imp-ok">Importar</button><button class="btn btn-block" style="margin-top:8px" id="imp-cx">Cancelar</button>');
  document.getElementById('imp-ok').addEventListener('click',importar);
  document.getElementById('imp-cx').addEventListener('click',closeModal);
}
function importar(){
  var txt=document.getElementById('imp-txt').value,c=DB[ci];var count=0;
  txt.split('\n').map(function(l){return l.trim();}).filter(Boolean).forEach(function(l){var ap,nm;if(l.indexOf(',')>=0){var p=l.split(',');ap=p[0].trim();nm=p[1].trim();}else{var p=l.trim().split(/\s+/);ap=p[0];nm=p.slice(1).join(' ');}if(ap&&nm){c.alumnos.push({id:'a'+Date.now()+Math.floor(Math.random()*9999),nombre:nm,apellido:ap});count++;}});
  c.alumnos.sort(function(x,y){return x.apellido.localeCompare(y.apellido,'es');});
  save();closeModal();renderAlumnos();toast(count+' alumno(s) importado(s)');
}
function modalDias(){
  var c=DB[ci],yr=new Date().getFullYear();
  var defC1i=yr+'-03-01',defC1f=yr+'-07-31',defC2i=yr+'-08-01',defC2f=yr+'-12-15';
  var c1i=c.cuatri?c.cuatri.c1i||defC1i:defC1i,c1f=c.cuatri?c.cuatri.c1f||defC1f:defC1f,c2i=c.cuatri?c.cuatri.c2i||defC2i:defC2i,c2f=c.cuatri?c.cuatri.c2f||defC2f:defC2f;
  function slotsHTML(){var s=DB[ci].diasHoras||[];if(!s.length)return'<div style="font-size:13px;color:var(--txt2);margin-bottom:8px">Aun no hay dias agregados.</div>';var h='';s.forEach(function(sl,i){h+='<div class="dia-slot"><div style="font-size:14px">'+DIAS[sl.dia]+' &middot; '+(sl.hora||'Sin hora')+'</div><button class="dia-slot-del" data-si="'+i+'">&times;</button></div>';});return h;}
  var diasBtns='';DIAS.forEach(function(d,i){diasBtns+='<button class="dia-btn" id="ndb-'+i+'" data-di="'+i+'">'+d+'</button>';});
  var mmOpts='';for(var m=0;m<60;m+=5){mmOpts+='<option value="'+(m<10?'0':'')+m+'">'+(m<10?'0':'')+m+'</option>';}
  var hhOpts='<option value="">HH</option>';for(var h=6;h<24;h++){hhOpts+='<option value="'+(h<10?'0':'')+h+'">'+(h<10?'0':'')+h+'</option>';}
  openModal('<div style="font-size:16px;font-weight:600;margin-bottom:14px">Configurar clases '+yr+'</div><div class="cuatri-sec"><div class="cuatri-ttl">1er cuatrimestre</div><div class="date-row"><div class="df"><label>Desde</label><input type="date" id="c1i" value="'+c1i+'"></div><div class="df"><label>Hasta</label><input type="date" id="c1f" value="'+c1f+'"></div></div></div><div class="cuatri-sec"><div class="cuatri-ttl">2do cuatrimestre</div><div class="date-row"><div class="df"><label>Desde</label><input type="date" id="c2i" value="'+c2i+'"></div><div class="df"><label>Hasta</label><input type="date" id="c2f" value="'+c2f+'"></div></div></div><div style="font-size:13px;font-weight:600;color:var(--txt2);margin:14px 0 8px">Dias y horarios</div><div id="slots-list">'+slotsHTML()+'</div><div style="background:var(--bg2);border:0.5px solid var(--brd);border-radius:var(--radius);padding:12px;margin-bottom:12px"><div style="font-size:13px;color:var(--txt2);margin-bottom:8px">Agregar dia</div><div class="dias-grid">'+diasBtns+'</div><div style="display:flex;gap:8px;align-items:flex-end"><div class="df"><label>Hora</label><div style="display:flex;gap:4px;align-items:center"><select id="nd-hh" style="flex:1;border:0.5px solid var(--brd2);border-radius:var(--radius);padding:9px 6px;font-size:15px;background:var(--bg);color:var(--txt)">'+hhOpts+'</select><span style="color:var(--txt2);font-weight:700">:</span><select id="nd-mm" style="flex:1;border:0.5px solid var(--brd2);border-radius:var(--radius);padding:9px 6px;font-size:15px;background:var(--bg);color:var(--txt)">'+mmOpts+'</select></div></div><button class="btn btn-primary btn-sm" id="add-slot" style="flex-shrink:0">Agregar</button></div></div><button class="btn btn-primary btn-block" id="gen-ok">Generar clases</button><button class="btn btn-block" style="margin-top:8px" id="gen-cx">Cancelar</button>',
  function(){
    var diaSeleccionado=-1;
    function bindSlotDel(){document.querySelectorAll('.dia-slot-del').forEach(function(btn){btn.addEventListener('click',function(){DB[ci].diasHoras.splice(parseInt(this.getAttribute('data-si')),1);save();document.getElementById('slots-list').innerHTML=slotsHTML();bindSlotDel();});});}
    DIAS.forEach(function(_,i){document.getElementById('ndb-'+i).addEventListener('click',function(){diaSeleccionado=parseInt(this.getAttribute('data-di'));document.querySelectorAll('[id^="ndb-"]').forEach(function(b){b.classList.remove('sel');});this.classList.add('sel');});});
    document.getElementById('add-slot').addEventListener('click',function(){if(diaSeleccionado<0){toast('Elige un dia primero');return;}var hh=document.getElementById('nd-hh').value,mm=document.getElementById('nd-mm').value;if(!hh){toast('Elige una hora');return;}if(!DB[ci].diasHoras)DB[ci].diasHoras=[];DB[ci].diasHoras.push({dia:diaSeleccionado,hora:hh+':'+mm});save();diaSeleccionado=-1;document.querySelectorAll('[id^="ndb-"]').forEach(function(b){b.classList.remove('sel');});document.getElementById('nd-hh').value='';document.getElementById('nd-mm').value='00';document.getElementById('slots-list').innerHTML=slotsHTML();bindSlotDel();toast('Dia agregado');});
    bindSlotDel();
    document.getElementById('gen-ok').addEventListener('click',generarClases);
    document.getElementById('gen-cx').addEventListener('click',closeModal);
  });
}
function generarClases(){
  var c=DB[ci],c1i=document.getElementById('c1i').value,c1f=document.getElementById('c1f').value,c2i=document.getElementById('c2i').value,c2f=document.getElementById('c2f').value;
  if(!c1i||!c1f||!c2i||!c2f){toast('Completa todas las fechas');return;}
  if(!c.diasHoras||!c.diasHoras.length){toast('Agrega al menos un dia');return;}
  c.cuatri={c1i:c1i,c1f:c1f,c2i:c2i,c2f:c2f};
  var rangos=[[c1i,c1f],[c2i,c2f]],yr=new Date().getFullYear(),clases=[];
  for(var m=0;m<12;m++){for(var d=1;d<=new Date(yr,m+1,0).getDate();d++){var fecha=new Date(yr,m,d),dow=fecha.getDay(),match=null;c.diasHoras.forEach(function(dh){if(dh.dia===dow)match=dh;});if(!match)continue;var dd=String(d).padStart(2,'0'),mm=String(m+1).padStart(2,'0'),iso=yr+'-'+mm+'-'+dd;var enRango=false;rangos.forEach(function(r){if(iso>=r[0]&&iso<=r[1])enRango=true;});if(!enRango)continue;clases.push({id:'cl'+iso+dow,fecha:d+'/'+(m+1),fechaISO:iso,diaNombre:DIAS[dow],hora:match.hora,asistencia:{},estado:''},);}}
  c.clases=clases;save();closeModal();curTab='clases';curCuat=0;curMes=-1;
  document.querySelectorAll('#curso-tabs .tab').forEach(function(t,i){t.classList.toggle('active',i===1);});
  ALL_TABS.forEach(function(t,i){document.getElementById('tab-'+t).style.display=i===1?'block':'none';});
  updateHeader();renderClases();toast(clases.length+' clases generadas');
}
function modalNuevoExamen(){
  var hoy=isoDate(new Date());
  openModal('<div style="font-size:16px;font-weight:600;margin-bottom:16px">Nuevo examen</div><div class="field-app"><label>Nombre</label><input id="ex-n" placeholder="Ej: Primer parcial"></div><div class="field-app"><label>Contenidos</label><textarea id="ex-c" placeholder="Unidades 1 y 2..."></textarea></div><div style="display:flex;gap:10px"><div class="field-app" style="flex:1"><label>Fecha</label><input type="date" id="ex-f" value="'+hoy+'"></div><div class="field-app" style="flex:1"><label>Hora</label><input type="time" id="ex-h"></div></div><button class="btn btn-primary btn-block" id="ex-ok">Crear examen</button><button class="btn btn-block" style="margin-top:8px" id="ex-cx">Cancelar</button>');
  document.getElementById('ex-ok').addEventListener('click',crearExamen);
  document.getElementById('ex-cx').addEventListener('click',closeModal);
  setTimeout(function(){var el=document.getElementById('ex-n');if(el)el.focus();},80);
}
function crearExamen(){
  var n=document.getElementById('ex-n').value.trim();if(!n){toast('Escribe un nombre');return;}
  var c=DB[ci];if(!c.examenes)c.examenes=[];
  c.examenes.push({id:'ex'+Date.now(),nombre:n,contenidos:document.getElementById('ex-c').value.trim(),fecha:fmtFecha(document.getElementById('ex-f').value),hora:document.getElementById('ex-h').value||'',notas:{}});
  save();closeModal();renderExamenes();toast('Examen creado');
}
function renderExamenes(){
  var c=DB[ci],el=document.getElementById('tab-examenes');
  if(!(c.examenes||[]).length){el.innerHTML='<div class="empty">Sin examenes aun.<br>Toca + para crear uno.</div>';return;}
  var html='';
  c.examenes.forEach(function(ex,ei){
    var nr='';
    c.alumnos.forEach(function(a){var nota=(ex.notas||{})[a.id];var n=nota!==undefined&&nota!==''?parseFloat(nota):null;var b=notaBadge(n);nr+='<div class="nota-row"><div class="av av-sm">'+ini(a.nombre,a.apellido)+'</div><div style="flex:1;font-size:14px">'+a.apellido+', '+a.nombre+'</div><input class="nota-inp" type="number" min="0" max="10" step="0.1" placeholder="--" value="'+(nota!==undefined&&nota!==''?nota:'')+'" data-ei="'+ei+'" data-aid="'+a.id+'"><span class="nota-b '+b.cls+'" id="nb-'+ei+'-'+a.id+'">'+b.txt+'</span></div>';});
    html+='<div class="exam-card"><div class="exam-hdr" data-ei="'+ei+'"><div><div style="font-weight:600;font-size:15px">'+ex.nombre+'</div><div style="font-size:12px;color:var(--txt2);margin-top:2px">'+(ex.fecha||'')+(ex.hora?' &middot; '+ex.hora:'')+'</div>'+(ex.contenidos?'<div style="font-size:12px;color:var(--txt2);margin-top:1px">'+ex.contenidos+'</div>':'')+'</div><span style="color:var(--txt2);font-size:18px" id="arr-'+ei+'">+</span></div><div class="exam-body" id="exbody-'+ei+'">'+(c.alumnos.length?nr:'<div style="font-size:13px;color:var(--txt2)">Agrega alumnos primero.</div>')+'<div style="margin-top:12px;display:flex;gap:8px;align-items:center"><button class="btn btn-primary btn-sm" data-saveex="'+ei+'">Guardar notas</button><button class="btn btn-sm btn-danger" data-delex="'+ei+'">Eliminar</button></div><div style="font-size:11px;color:var(--txt2);margin-top:6px">Verde = 7 o mas</div></div></div>';
  });
  el.innerHTML=html;
  document.querySelectorAll('.exam-hdr').forEach(function(h){h.addEventListener('click',function(){var ei=parseInt(this.getAttribute('data-ei'));var body=document.getElementById('exbody-'+ei),arr=document.getElementById('arr-'+ei);var open=body.style.display==='block';body.style.display=open?'none':'block';arr.textContent=open?'+':'-';});});
  document.querySelectorAll('.nota-inp').forEach(function(inp){inp.addEventListener('input',function(){var v=parseFloat(this.value);var ei=parseInt(this.getAttribute('data-ei')),aid=this.getAttribute('data-aid');if(!DB[ci].examenes[ei].notas)DB[ci].examenes[ei].notas={};if(isNaN(v)||this.value===''){DB[ci].examenes[ei].notas[aid]='';var b=document.getElementById('nb-'+ei+'-'+aid);if(b){b.textContent='--';b.className='nota-b nb-em';}}else{v=Math.min(10,Math.max(0,v));DB[ci].examenes[ei].notas[aid]=v;var b=document.getElementById('nb-'+ei+'-'+aid);if(b){var nb=notaBadge(v);b.textContent=nb.txt;b.className='nota-b '+nb.cls;}}});});
  document.querySelectorAll('[data-saveex]').forEach(function(btn){btn.addEventListener('click',function(){save();toast('Notas guardadas');});});
  document.querySelectorAll('[data-delex]').forEach(function(btn){btn.addEventListener('click',function(){var ei=parseInt(this.getAttribute('data-delex'));confirmar('Eliminar '+DB[ci].examenes[ei].nombre+'?',function(){DB[ci].examenes.splice(ei,1);save();renderExamenes();toast('Examen eliminado');});});});
}
