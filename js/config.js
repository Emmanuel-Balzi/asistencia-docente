var SUPABASE_URL = 'https://gklyxotqwktmhsrvgnwq.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbHl4b3Rxd2t0bWhzcnZnbndxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MTg0MjksImV4cCI6MjA4OTA5NDQyOX0.3P7alyhP9BNR9bIy-ajaisArMsvIYHc70bmzPtnhvHk';
var VENCIMIENTO = '2026-12-20';

var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
var currentUser = null;
var DB = [];

var DIAS=['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
var MESES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
var MESES_C1=[2,3,4,5,6];
var MESES_C2=[7,8,9,10,11];
var NOTA_APROBADO=7;
var ALL_TABS=['alumnos','clases','stats','examenes','resumen'];
var ci=-1,li=-1,curTab='alumnos',curScreen='cursos',curCuat=0,curMes=-1;

