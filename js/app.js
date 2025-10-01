document.addEventListener("DOMContentLoaded", () => {
  // ===== DOM =====
  const clsSel      = document.getElementById("cls");
  const btnCall     = document.getElementById("btnCall");
  const studentTop  = document.getElementById("studentTop");
  const overlay     = document.getElementById("overlay");
  const bigName     = document.getElementById("bigName");

  const lessonWrap  = document.getElementById("lessonWrap");
  const btnShuffle  = document.getElementById("btnShuffle");
  const btnStart    = document.getElementById("btnStart");
  const btnConfirm  = document.getElementById("btnConfirm");
  const btnNext     = document.getElementById("btnNext");
  const btnEnd      = document.getElementById("btnEnd");
  const btnReplay   = document.getElementById("btnReplay");

  const qtext       = document.getElementById("qtext");
  const opts        = document.getElementById("opts");
  const prog        = document.getElementById("prog");
  const card        = document.getElementById("card");
  const hint        = document.getElementById("hint");
  const toast       = document.getElementById("toast");
  const fx          = document.getElementById("fx");

  const bigTimer    = document.getElementById("bigTimer");
  const bgm         = document.getElementById("bgm");
  const sfxCorrect  = document.getElementById("sfx-correct");
  const sfxWrong    = document.getElementById("sfx-wrong");
  const sfxClap     = document.getElementById("sfx-clap");
  const sfxShuffle  = document.getElementById("sfx-shuffle");
  const musicToggle = document.getElementById("musicToggle");

  // ===== State =====
  let studentList = [];
  let currentStudent = null;
  const selectedLessons = new Set(); // C1_B1…C5_B5
  let pool = [];
  let idx = 0;
  let score = 0;
  let timer = null;
  let timePerQ = 60;
  let numQ = 10;

  // ===== Helpers =====
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const showToast = (m)=>{ toast.textContent=m; toast.style.display='block'; setTimeout(()=>toast.style.display='none',1600); };
  const setDisabled = (el, v)=>{ el.disabled = !!v; };

  function updateStartButton() {
    const hasStudent = !!currentStudent;
    const hasLesson  = selectedLessons.size > 0;
    const n = parseInt(document.getElementById("num").value || "0",10);
    btnStart.disabled = !(hasStudent && hasLesson && n>0);
  }

  function setClock() {
    document.getElementById("clock").textContent =
      new Date().toLocaleTimeString("vi-VN").slice(0,8);
  }
  setInterval(setClock, 1000); setClock();

  // ===== Render lớp 8A1..8A7 =====
  ["8A1","8A2","8A3","8A4","8A5","8A6","8A7"].forEach(l=>{
    const o=document.createElement("option"); o.value=l; o.textContent=l; clsSel.appendChild(o);
  });

  // ===== Render lessons (Ch I–V x Bài 1–5) =====
  (function renderLessons(){
    const roman = ["I","II","III","IV","V"];
    for(let c=1;c<=5;c++){
      const tag = document.createElement("div");
      tag.className="pill"; tag.textContent=`Chương ${roman[c-1]}`;
      tag.style.gridColumn="span 6"; tag.style.background="#222"; tag.style.cursor="default";
      lessonWrap.appendChild(tag);
      for(let b=1;b<=5;b++){
        const key = `C${c}_B${b}`;
        const p = document.createElement("div");
        p.className="pill"; p.textContent=`Bài ${b}`;
        p.onclick=()=>{
          if(p.classList.contains("active")){ p.classList.remove("active"); selectedLessons.delete(key);}
          else{ p.classList.add("active"); selectedLessons.add(key); }
          setDisabled(btnShuffle, selectedLessons.size===0);
          updateStartButton();
        };
        lessonWrap.appendChild(p);
      }
    }
  })();

  // ===== Load files =====
  async function loadStudentsByClass(lop){
    try{
      const r=await fetch(`data/students_${lop.toLowerCase()}.json`);
      return await r.json();
    }catch{ showToast("Không tải được danh sách HS!"); return []; }
  }
  async function loadQuestionsByBai(b){
    try{
      const r=await fetch(`data/questions_b${b}.json`);
      return await r.json();
    }catch{ showToast(`Thiếu questions_b${b}.json`); return []; }
  }
  async function buildPoolFromSelected(){
    const setBai = new Set([...selectedLessons].map(k=>parseInt(k.split("_B")[1],10)));
    const data = await Promise.all([...setBai].map(b=>loadQuestionsByBai(b)));
    let merged = data.flat();
    // shuffle Fisher-Yates
    for(let i=merged.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [merged[i],merged[j]]=[merged[j],merged[i]]; }
    return merged;
  }

  // ===== Gọi tên HS =====
  btnCall.onclick = async ()=>{
    if(!clsSel.value){ showToast("Chọn lớp trước!"); return; }
    studentList = await loadStudentsByClass(clsSel.value);
    if(!studentList.length){ showToast("Danh sách lớp trống!"); return; }

    overlay.classList.remove("hide");
    let t=0; const spin=setInterval(()=>{
      bigName.textContent = studentList[Math.floor(Math.random()*studentList.length)];
      t+=100; if(t>=4000){
        clearInterval(spin);
        currentStudent = studentList[Math.floor(Math.random()*studentList.length)];
        bigName.textContent = currentStudent;
        setTimeout(()=>{
          overlay.classList.add("hide");
          studentTop.textContent = currentStudent;
          updateStartButton();
        },3000);
      }
    },100);
  };

  // ===== Trộn bài =====
  btnShuffle.onclick = async ()=>{
    if(selectedLessons.size===0) return;
    fx.classList.remove("hide");
    sfxShuffle.currentTime=0; sfxShuffle.play();
    pool = await buildPoolFromSelected();
    setTimeout(()=>{ fx.classList.add("hide"); showToast(`Đã trộn ${pool.length} câu`); },3000);
  };

  // ===== Timer =====
  function startTimer(sec){
    clearInterval(timer);
    let t = sec;
    bigTimer.textContent = String(t).padStart(2,"0");
    timer = setInterval(()=>{
      t--; bigTimer.textContent = String(t).padStart(2,"0");
      if(t<=0){ clearInterval(timer); timeUpReveal(); }
    },1000);
  }
  function timeUpReveal(){
    const ans = String(pool[idx].a ?? pool[idx].answer);
    document.querySelectorAll(".opt").forEach(o=>{
      if(o.textContent.trim()===ans) o.classList.add("correct");
      o.onclick=null;
    });
    btnConfirm.classList.add("hide");
    btnNext.classList.remove("hide");
    showToast("Hết giờ!");
  }

  // ===== Render 1 câu =====
  function renderQuestion(){
    if(idx>=pool.length){ endGame(); return; }
    const q = pool[idx];
    qtext.innerHTML = q.q || q.question || "—";
    if(window.MathJax?.typesetPromise) MathJax.typesetPromise();

    opts.innerHTML="";
    (q.options || q.choices || []).slice(0,4).forEach(t=>{
      const div=document.createElement("div");
      div.className="opt"; div.textContent=t;
      div.onclick=()=>{
        document.querySelectorAll(".opt").forEach(x=>x.classList.remove("selected"));
        div.classList.add("selected");
      };
      opts.appendChild(div);
    });
    prog.textContent = `Câu ${idx+1}/${pool.length
