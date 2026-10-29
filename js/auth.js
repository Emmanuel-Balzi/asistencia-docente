// ---- INIT ----
var appInited = false;

window.addEventListener('load', async function(){
  var params = new URLSearchParams(window.location.search);
  if(params.get('pago')==='ok'){
    window.history.replaceState({}, '', window.location.pathname);
  }
  initApp();
});

async function initApp(){
  appInited = false;
  var res = await sb.auth.getSession();
  var session = res.data ? res.data.session : null;
  appInited = true;
  if(session && session.user){
    currentUser = session.user;
    await checkAccess();
  } else {
    showView('auth');
  }
}

var DIAS_PRUEBA = 3;

async function checkAccess(){
  var hoy = new Date().toISOString().split('T')[0];
  if(hoy > VENCIMIENTO){
    showVencida();
    return;
  }
  var {data:profile} = await sb.from('profiles').select('activo, fecha_registro').eq('id', currentUser.id).single();
  
  if(profile && profile.activo){
    await loadData();
    showView('app');
    document.getElementById('user-email-bar').textContent = currentUser.email;
    var mp = document.getElementById('marca-prueba');
    if(mp) mp.style.display='none';
    var bp = document.getElementById('banner-prueba');
    if(bp) bp.style.display='none';
    renderCursos();
    return;
  }

  // Verificar periodo de prueba
  if(profile && profile.fecha_registro){
    var fechaReg = new Date(profile.fecha_registro);
    var ahora = new Date();
    var diffMs = ahora - fechaReg;
    var diffDias = diffMs / (1000 * 60 * 60 * 24);
    var diasRestantes = Math.ceil(DIAS_PRUEBA - diffDias);

    if(diffDias < DIAS_PRUEBA){
      await loadData();
      showView('app');
      document.getElementById('user-email-bar').textContent = currentUser.email;
      // Mostrar banner de prueba
      var diasTxt = diasRestantes===1?'queda 1 dia':'quedan '+diasRestantes+' dias';
      var bp = document.getElementById('banner-prueba');
      var bpt = document.getElementById('banner-prueba-txt');
      if(bp){bp.style.display='flex';}
      if(bpt){bpt.textContent='Periodo de prueba: te '+diasTxt+'.';}
      var mp = document.getElementById('marca-prueba');
      if(mp) mp.style.display='block';
      renderCursos();
      return;
    }
  }

  // Sin prueba y sin pago
  showView('pago');
}

function showVencida(){
  document.getElementById('loading').style.display='none';
  document.body.innerHTML='<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center"><div><div style="font-size:48px;margin-bottom:16px">&#128197;</div><h2 style="font-size:20px;font-weight:700;margin-bottom:8px">Suscripcion vencida</h2><p style="font-size:14px;color:var(--txt2)">La suscripcion 2026 vencio el 20/12/2026.<br>Contacta al administrador para renovar.</p></div></div>';
}

function showView(v){
  document.getElementById('loading').style.display='none';
  document.getElementById('view-auth').style.display='none';
  document.getElementById('view-pago').style.display='none';
  document.getElementById('view-app').style.display='none';
  document.getElementById('view-'+v).style.display='block';
  if(v==='auth'){
    var em=document.getElementById('login-email');
    var ps=document.getElementById('login-pass');
    if(em)em.value='';
    if(ps)ps.value='';
    clearTimeout(inactivityTimer);
  }
  if(v==='app'){
    resetInactivityTimer();
  }
}

function iniciarPagoClick(){iniciarPago();}
function logoutClick(){logout();}

// ---- INACTIVIDAD (3 minutos) ----
var inactivityTimer = null;
var INACTIVITY_MS = 3 * 60 * 1000;

function resetInactivityTimer(){
  if(curScreen==='cursos'||curScreen==='curso'||curScreen==='clase'){
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(function(){
      toast('Sesion cerrada por inactividad');
      setTimeout(function(){logout();},1500);
    }, INACTIVITY_MS);
  }
}

['click','touchstart','keydown','scroll'].forEach(function(ev){
  document.addEventListener(ev, resetInactivityTimer, true);
});

// ---- VER CONTRASENA ----
function togglePass(inputId, btn){
  var input = document.getElementById(inputId);
  if(!input) return;
  var isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  var b = typeof btn === 'string' ? document.getElementById(btn) : btn;
  if(b) b.style.opacity = isPass ? '1' : '0.4';
}

// ---- AUTH ----
function irAPago(){showView('pago');}

function mostrarOlvidePass(){
  document.getElementById('form-login').style.display='none';
  document.getElementById('form-registro').style.display='none';
  document.getElementById('form-olvide').style.display='block';
  document.getElementById('auth-error').classList.remove('show');
  setTimeout(function(){var el=document.getElementById('olvide-email');if(el)el.focus();},80);
}

function volverLogin(){
  document.getElementById('form-olvide').style.display='none';
  document.getElementById('form-login').style.display='block';
  document.getElementById('auth-error').classList.remove('show');
}

function showAuthTab(tab){
  document.getElementById('tab-login').classList.toggle('active', tab==='login');
  document.getElementById('tab-registro').classList.toggle('active', tab==='registro');
  document.getElementById('form-login').style.display = tab==='login'?'block':'none';
  document.getElementById('form-registro').style.display = tab==='registro'?'block':'none';
  document.getElementById('auth-error').classList.remove('show');
}

function authError(msg){
  var el=document.getElementById('auth-error');
  el.textContent=msg;el.classList.add('show');
}

document.getElementById('btn-login').addEventListener('click', async function(){
  var email=document.getElementById('login-email').value.trim();
  var pass=document.getElementById('login-pass').value;
  if(!email||!pass){authError('Completa todos los campos');return;}
  var btn=this;
  btn.textContent='Ingresando...';btn.disabled=true;
  var res=await sb.auth.signInWithPassword({email:email,password:pass});
  if(res.error){
    authError('Email o contrasena incorrectos');
    btn.textContent='Iniciar sesion';
    btn.disabled=false;
  } else {
    currentUser=res.data.user;
    await checkAccess();
    btn.textContent='Iniciar sesion';
    btn.disabled=false;
  }
});

document.getElementById('btn-olvide').addEventListener('click', async function(){
  var email=document.getElementById('olvide-email').value.trim();
  if(!email){authError('Ingresa tu email');return;}
  var btn=this;
  btn.textContent='Verificando...';btn.disabled=true;

  // Verificar si el email existe y esta activo
  var verRes=await fetch('https://gklyxotqwktmhsrvgnwq.supabase.co/functions/v1/verificar-email',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:email})
  });
  var verData=await verRes.json();

  if(!verData.existe){
    authError('No encontramos una cuenta registrada con ese email.');
    btn.textContent='Enviar link';btn.disabled=false;
    return;
  }

  if(!verData.activo){
    authError('Esa cuenta no tiene una suscripcion activa.');
    btn.textContent='Enviar link';btn.disabled=false;
    return;
  }

  btn.textContent='Enviando...';
  var {error}=await sb.auth.resetPasswordForEmail(email,{
    redirectTo:'https://registrodeldocente.com.ar'
  });
  if(error){
    authError('Error al enviar el email. Intenta de nuevo.');
    btn.textContent='Enviar link';btn.disabled=false;
  } else {
    document.getElementById('auth-error').classList.remove('show');
    var ok=document.getElementById('auth-error');
    ok.style.background='var(--suc-bg)';ok.style.color='var(--suc)';
    ok.style.display='block';
    ok.textContent='Te enviamos un link a '+email+'. Revisa tu bandeja de entrada.';
    btn.textContent='Enviado!';btn.disabled=true;
  }
});

document.getElementById('btn-registro').addEventListener('click', async function(){
  var email=document.getElementById('reg-email').value.trim();
  var pass=document.getElementById('reg-pass').value;
  var pass2=document.getElementById('reg-pass2').value;
  if(!email||!pass||!pass2){authError('Completa todos los campos');return;}
  if(pass!==pass2){authError('Las contrasenas no coinciden');return;}
  if(pass.length<6){authError('La contrasena debe tener al menos 6 caracteres');return;}
  this.textContent='Creando cuenta...';this.disabled=true;
  var {error}=await sb.auth.signUp({email,password:pass});
  if(error){authError('Error al crear cuenta: '+error.message);this.textContent='Crear cuenta';this.disabled=false;}
  else{authError('');document.getElementById('auth-error').style.display='none';
    document.getElementById('auth-error').className='auth-error';
    var ok=document.getElementById('auth-error');
    ok.style.background='var(--suc-bg)';ok.style.color='var(--suc)';ok.style.display='block';
    ok.textContent='Cuenta creada. Revisa tu email para confirmar.';}
});

async function logout(){
  currentUser = null;
  DB = [];
  await sb.auth.signOut();
  // Resetear boton login
  var btn = document.getElementById('btn-login');
  if(btn){btn.textContent='Iniciar sesion';btn.disabled=false;}
  var bp = document.getElementById('banner-prueba');
  if(bp) bp.style.display='none';
  var mp = document.getElementById('marca-prueba');
  if(mp) mp.style.display='none';
  // Resetear boton registro
  var btnReg = document.getElementById('btn-registro');
  if(btnReg){btnReg.textContent='Crear cuenta';btnReg.disabled=false;}
  // Volver a tab login
  showAuthTab('login');
  showView('auth');
}

// ---- PAGO ----
async function iniciarPago(){
  var btn=document.getElementById('btn-pagar');
  btn.textContent='Generando link de pago...';btn.disabled=true;
  var {data:{session}}=await sb.auth.getSession();
  var res=await fetch(SUPABASE_URL+'/functions/v1/crear-preferencia',{
    method:'POST',
    headers:{'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'}
  });
  var data=await res.json();
  if(data.init_point){
    window.location.href=data.init_point;
  } else {
    document.getElementById('pago-error').style.display='block';
    document.getElementById('pago-error').textContent='Error al generar el pago. Intenta de nuevo.';
    btn.textContent='Suscribirse con Mercado Pago';btn.disabled=false;
  }
}

