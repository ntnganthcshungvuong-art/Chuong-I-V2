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
  const debugPane   = document.getElementById("debug");
  const taskbar     = document.getElementById("taskbar");

  const bigTimer    = document.getElementById("bigTimer");
  const bgm         = document.getElementById("bgm");
  const sfxCorrect  = document.getElementById("sfx-correct");
  const sfxWrong    = document.getElementById("sfx-wrong");
  const sfxClap     = document.getElementById("sfx-clap");
  const sfxShuffle  = document.getElementById("sfx-shuffle");
  const musicToggle = document.getElementById("musicToggle");

  // ===== State =====
  let studentList = [];         // danh sách theo lớp đã chọn
  let currentStudent = null;    // học sinh đang chơi
  const selectedLessons = new Set(); // C1_B1…C5_B5
  let pool = [];                // câu hỏi sau khi nạp & trộn
  let idx = 0;                  // chỉ số câu hiện tại
  let score = 0;
  let timer = null;
  let timePerQ = 60;
  let numQ = 10;

  // ===== Helpers =====
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const showToast = (m)=>{ toast.textContent=m; toast.style.display='block'; setTimeout(()=>toast.style.display='none',1600); };
  const setDisabled = (el, v)=>{ el.disabled = !!v; };
  const buzz = (el)=>{ el.classList.add("clicked"); setTimeout(()=>el.classList.remove("clicked"), 200); };
  const logErr = (msg)=>{ debugPane.style.display='block'; debugPane.textContent = `[${new Date().toLocaleTimeString('vi-VN')}] ${msg}\n` + debugPane.textContent; console.error(msg); };

  function updateStartButton() {
    const hasStudent = !!currentStudent;
    const hasLesson  = selectedLessons.size > 0;
    const n = parseInt(document.getElementById("num").value || "0",10);
    btnStart.disabled = !(hasStudent && hasLesson && n>0);
    btnEnd.disabled   = true; // chỉ mở khi đang làm bài
  }

  function setClock() {
    document.getElementById("clock").textContent =
      new Date().toLocaleTimeString("vi-VN").slice(0,8);
  }
  setInterval(setClock, 1000); setClock();

  // ===== Render lessons (Ch I–V x Bài 1–5) =====
  (function renderLessons(){
    const roman = ["I","II","III","IV","V"];
    for(let c=1;c<=5;c++){
      const tag = document.createElement("div");
      tag.className="pill"; tag.textContent=`Chương ${roman[c-1]}`;
      tag.style.gridColumn="span 6"; tag.style.background="#222"; tag.style.cursor="default"; tag.style.fontWeight="900";
      lessonWrap.appendChild(tag);
      for(let b=1;b<=5;b++){
        const key = `C${c}_B${b}`;
        const p = document.createElement("div");
        p.className="pill"; p.textContent=`Bài ${b}`;
        p.onclick=()=>{
          p.classList.toggle("active");
          if(p.classList.contains("active")) selectedLessons.add(key); else selectedLessons.delete(key);
          setDisabled(btnShuffle, selectedLessons.size===0);
          updateStartButton();
          buzz(p);
        };
        lessonWrap.appendChild(p);
      }
    }
  })();

  // ===== Load files =====
  async function loadStudentsByClass(lop){
    try{
      const r=await fetch(`data/students_${lop.toLowerCase()}.json`, {cache:"no-cache"});
      if(!r.ok) throw new Error(`HTTP ${r.status} for students_${lop}.json`);
      const data = await r.json();
      const arr = Array.isArray(data) ? data : (data.students || []);
      if(!Array.isArray(arr) || arr.length===0) throw new Error(`students_${lop}.json rỗng/format sai`);
      return arr;
    }catch(e){ logErr(e.message); showToast("Không tải được danh sách HS!"); return []; }
  }
  async function loadQuestionsByBai(b){
    try{
      const r=await fetch(`data/questions_b${b}.json`, {cache:"no-cache"});
      if(!r.ok) throw new Error(`HTTP ${r.status} for questions_b${b}.json`);
      const data = await r.json();
      if(!Array.isArray(data) || !data.length) throw new Error(`questions_b${b}.json rỗng/format sai`);
      return data;
    }catch(e){ logErr(e.message); showToast(`Thiếu questions_b${b}.json`); return []; }
  }
  async function buildPoolFromSelected(){
    const setBai = new Set([...selectedLessons].map(k=>parseInt(k.split("_B")[1],10)));
    const data = await Promise.all([...setBai].map(b=>loadQuestionsByBai(b)));
    let merged = data.flat();
    // shuffle Fisher-Yates
    for(let i=merged.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [merged[i],merged[j]]=[merged[j],merged[i]]; }
    return merged;
  }

  // ===== Gọi tên HS (4s quay → 3s giữ → thu nhỏ lên topbar) =====
  btnCall.onclick = async ()=>{
    buzz(btnCall);
    const lop = (clsSel.value || "").toLowerCase();
    if(!lop){ showToast("Chọn lớp trước!"); return; }

    const list = await loadStudentsByClass(lop);
    if(!list.length){ return; }
    studentList = list;

    overlay.classList.remove("hide");
    let t=0; const spin=setInterval(()=>{
      bigName.textContent = studentList[Math.floor(Math.random()*studentList.length)];
      t+=100; if(t>=4000){
        clearInterval(spin);
        const finalName = studentList[Math.floor(Math.random()*studentList.length)];
        bigName.textContent = finalName;

        // sau 3s: animate shrink to topbar
        setTimeout(()=>{
          overlay.classList.add("hide");
          animateNameToTop(finalName);
        },3000);
      }
    },100);
  };

  // FLIP animation: bigName -> studentTop
  function animateNameToTop(name){
    const ghost = document.createElement("div");
    ghost.textContent = name;
    ghost.style.position="fixed";
    ghost.style.left="50%";
    ghost.style.top="50%";
    ghost.style.transform="translate(-50%,-50%)";
    ghost.style.fontSize="72px";
    ghost.style.fontWeight="900";
    ghost.style.color="#ffeb3b";
    ghost.style.textShadow="2px 2px 8px #000";
    ghost.style.zIndex="1000";
    document.body.appendChild(ghost);

    const topRect = studentTop.getBoundingClientRect();
    const ghostRect = ghost.getBoundingClientRect();

    const dx = topRect.left + topRect.width/2 - (ghostRect.left + ghostRect.width/2);
    const dy = topRect.top + topRect.height/2 - (ghostRect.top + ghostRect.height/2);
    const scale = 0.28;

    ghost.animate([
      { transform:"translate(-50%,-50%) scale(1)", opacity:1 },
      { transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`, opacity:1 }
    ], { duration:650, easing:"cubic-bezier(.2,.8,.2,1)" })
    .onfinish = ()=>{
      ghost.remove();
      currentStudent = name;
      studentTop.textContent = name;
      updateStartButton();
    };
  }

  // ===== Trộn bài: hiệu ứng mưa ký tự + âm thanh 3s =====
  btnShuffle.onclick = async ()=>{
    buzz(btnShuffle);
    if(selectedLessons.size===0){ showToast("Chọn ít nhất 1 bài!"); return; }

    // Build pool trước để báo số lượng
    pool = await buildPoolFromSelected();

    // FX symbols
    fx.innerHTML = ""; // clear
    fx.classList.add("show");
    const chars = "Σ∆πθλμxyz12345+=−×÷√αβγ";
    const count = 42;
    for(let i=0;i<count;i++){
      const s = document.createElement("span");
      s.className="symbol";
      s.textContent = chars[Math.floor(Math.random()*chars.length)];
      s.style.left = Math.floor(Math.random()*100) + "vw";
      s.style.fontSize = (18 + Math.random()*30) + "px";
      s.style.animationDelay = (Math.random()*0.9) + "s";
      fx.appendChild(s);
    }
    try{ sfxShuffle?.play().catch(()=>{});}catch{}
    setTimeout(()=>{ fx.classList.remove("show"); showToast(`Đã trộn ${pool.length} câu`); },3000);

    updateStartButton();
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

  // ===== Render 1 câu (MathJax + chữ to + đáp án căn trái, chọn 1) =====
  async function renderQuestion(){
    if(idx>=pool.length){ endGame(); return; }
    const q = pool[idx];

    qtext.innerHTML = q.q || q.question || "—";
    // typeset chỉ vùng qtext để nhanh
    if(window.MathJax?.typesetClear){ MathJax.typesetClear([qtext]); }
    if(window.MathJax?.typesetPromise){ await MathJax.typesetPromise([qtext]); }

    opts.innerHTML="";
    (q.options || q.choices || []).slice(0,4).forEach(t=>{
      const div=document.createElement("div");
      div.className="opt"; div.textContent=t;
      div.onclick=()=>{
        document.querySelectorAll(".opt").forEach(x=>x.classList.remove("selected"));
        div.classList.add("selected");
        btnConfirm.classList.remove("hide");
        buzz(div);
      };
      opts.appendChild(div);
    });

    prog.textContent = `Câu ${idx+1}/${pool.length} — Điểm: ${score}`;
    btnConfirm.classList.remove("hide");
    btnNext.classList.add("hide");
    startTimer(timePerQ);
  }

  // ===== Start =====
  btnStart.onclick = async ()=>{
    buzz(btnStart);
    if(!currentStudent){ showToast("Gọi tên HS trước!"); return; }
    if(selectedLessons.size===0){ showToast("Chọn bài trước!"); return; }

    timePerQ = clamp(parseInt(document.getElementById("time").value||"60",10),10,180);
    numQ    = clamp(parseInt(document.getElementById("num").value||"10",10),1,100);

    if(!pool.length) pool = await buildPoolFromSelected();
    pool = pool.slice(0, Math.min(numQ, pool.length));

    idx=0; score=0;
    setDisabled(btnCall,true);
    setDisabled(btnShuffle,true);
    setDisabled(btnEnd,false);

    hint.classList.add("hide");
    card.classList.remove("hide");
    renderQuestion();
  };

  // ===== Xác nhận =====
  btnConfirm.onclick = ()=>{
    buzz(btnConfirm);
    const sel = document.querySelector(".opt.selected");
    if(!sel){ showToast("Chọn đáp án!"); return; }
    clearInterval(timer);

    const ans = String(pool[idx].a ?? pool[idx].answer);
    if(sel.textContent.trim()===ans){ sel.classList.add("correct"); score++; try{sfxCorrect?.play();}catch{} }
    else{
      sel.classList.add("incorrect"); try{sfxWrong?.play();}catch{}
      document.querySelectorAll(".opt").forEach(o=>{ if(o.textContent.trim()===ans) o.classList.add("correct"); });
    }
    document.querySelectorAll(".opt").forEach(o=>o.onclick=null);
    btnConfirm.classList.add("hide");
    btnNext.classList.remove("hide");
    prog.textContent = `Câu ${idx+1}/${pool.length} — Điểm: ${score}`;
  };

  // ===== Câu tiếp =====
  btnNext.onclick = ()=>{ buzz(btnNext); idx++; renderQuestion(); };

  // ===== Kết thúc =====
  function endGame(){
    clearInterval(timer);
    qtext.innerHTML = `<b>Kết thúc!</b> ${currentStudent ? currentStudent + " " : ""}được ${score}/${pool.length} điểm.`;
    if(window.MathJax?.typesetClear){ MathJax.typesetClear([qtext]); }
    if(window.MathJax?.typesetPromise){ MathJax.typesetPromise([qtext]); }
    opts.innerHTML=""; btnConfirm.classList.add("hide"); btnNext.classList.add("hide");
    btnReplay.classList.remove("hide");
    try{sfxClap?.play();}catch{}
  }
  btnEnd.onclick = ()=>{ buzz(btnEnd); endGame(); };

  // ===== Chơi lại =====
  btnReplay.onclick = ()=>{
    buzz(btnReplay);
    btnReplay.classList.add("hide");
    card.classList.add("hide"); hint.classList.remove("hide");
    setDisabled(btnCall,false);
    setDisabled(btnShuffle, selectedLessons.size===0 ? true : false);
    setDisabled(btnEnd,true);
    pool=[]; score=0; idx=0; bigTimer.textContent="00";
    showToast("Đã sẵn sàng chơi lại");
  };

  // ===== Music toggle =====
  musicToggle.onclick = ()=>{
    buzz(musicToggle);
    try{
      if(bgm.paused){ bgm.play(); musicToggle.textContent="🔊"; }
      else{ bgm.pause(); musicToggle.textContent="🔈"; }
    }catch(e){ logErr("Không phát được nhạc nền (trình duyệt chặn autoplay)"); }
  };

  // ===== Drag window + thu nhỏ/mở lại (kiểu Windows) =====
  (function dragWin(){
    const win = document.getElementById("cfg"); const bar = document.getElementById("cfgBar");
    let sx=0, sy=0, dx=0, dy=0, dragging=false;
    bar.addEventListener("mousedown",e=>{dragging=true;sx=e.clientX;sy=e.clientY;dx=win.offsetLeft;dy=win.offsetTop;});
    document.addEventListener("mousemove",e=>{ if(!dragging) return; win.style.left=dx+(e.clientX-sx)+"px"; win.style.top=dy+(e.clientY-sy)+"px"; });
    document.addEventListener("mouseup",()=>dragging=false);

    const wMin = document.getElementById("wMin");
    const wMax = document.getElementById("wMax");

    // taskbar chip
    let chip = null;
    wMin.onclick = ()=>{
      buzz(wMin);
      if(win.classList.contains("hide")) return;
      win.classList.add("hide");
      chip = document.createElement("div");
      chip.className="task-chip";
      chip.textContent="⚙️ Cấu hình";
      chip.onclick = ()=>{ win.classList.remove("hide"); chip.remove(); chip=null; };
      taskbar.appendChild(chip);
      showToast("Đã thu cửa sổ cấu hình");
    };
    wMax.onclick = ()=>{ buzz(wMax); win.classList.remove("hide"); if(chip){ chip.remove(); chip=null; } };
  })();

  // ===== +/- input time/num =====
  document.querySelectorAll(".btn-mini").forEach(b=>{
    b.addEventListener("click",()=>{
      buzz(b);
      const t=b.getAttribute("data-t"), d=parseInt(b.getAttribute("data-d"),10);
      const el=document.getElementById(t==="time"?"time":"num");
      el.value = clamp(parseInt(el.value||"0",10)+d, t==="time"?10:1, t==="time"?180:100);
      updateStartButton();
    });
  });
  document.getElementById("time").addEventListener("input",updateStartButton);
  document.getElementById("num").addEventListener("input",updateStartButton);

  // ===== Đồng hồ =====
  setInterval(()=>{ document.getElementById("clock").textContent = new Date().toLocaleTimeString("vi-VN").slice(0,8); },1000);
});
