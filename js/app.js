document.addEventListener("DOMContentLoaded", () => {
  /* ==== DOM ==== */
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
  const bgmSelect   = document.getElementById("bgmSelect");

  /* ==== STATE ==== */
  let studentList = [];
  let currentStudent = null;
  const selectedLessons = new Set(); // C1_B1…C5_B5
  let pool = [];
  let idx = 0;
  let score = 0;
  let timer = null;
  let timePerQ = 60;
  let numQ = 10;

  /* ==== HELPERS ==== */
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const buzz  = el=>{ el.classList.add("clicked"); setTimeout(()=>el.classList.remove("clicked"),180); };
  const toastMsg = m=>{ toast.textContent=m; toast.style.display="block"; setTimeout(()=>toast.style.display="none",1600); };
  const setDisabled=(el,v)=> el.disabled=!!v;
  const logErr = (msg)=>{ debugPane.style.display='block'; debugPane.textContent = `[${new Date().toLocaleTimeString('vi-VN')}] ${msg}\n` + debugPane.textContent; console.error(msg); };

  function updateStartButton(){
    const hasHS = !!currentStudent;
    const hasLesson = selectedLessons.size>0;
    const n = +document.getElementById("num").value||0;
    btnStart.disabled = !(hasHS && hasLesson && n>0 && pool.length>0);
  }

  function setClock(){ document.getElementById("clock").textContent=new Date().toLocaleTimeString("vi-VN").slice(0,8); }
  setInterval(setClock,1000); setClock();

  /* ==== BUILD LESSON GRID (Ch I–V, B1–B5, có Chọn tất/Bỏ hết) ==== */
  (function renderLessons(){
    const roman=["I","II","III","IV","V"];
    for(let c=1;c<=5;c++){
      const head = document.createElement("div");
      head.className="pill chapter";
      head.innerHTML = `Chương ${roman[c-1]} <span style="float:right;display:flex;gap:6px">
        <button class="btn-mini mini-ctl" data-act="all"  data-c="${c}">✓</button>
        <button class="btn-mini mini-ctl" data-act="none" data-c="${c}">×</button>
      </span>`;
      lessonWrap.appendChild(head);

      for(let b=1;b<=5;b++){
        const key=`C${c}_B${b}`;
        const p=document.createElement("div");
        p.className="pill"; p.textContent=`Bài ${b}`;
        p.onclick=()=>{ p.classList.toggle("active");
          if(p.classList.contains("active")) selectedLessons.add(key); else selectedLessons.delete(key);
          setDisabled(btnShuffle, selectedLessons.size===0);
          buzz(p);
        };
        lessonWrap.appendChild(p);
      }
    }
    lessonWrap.querySelectorAll(".mini-ctl").forEach(btn=>{
      btn.onclick=()=>{
        buzz(btn);
        const c=+btn.dataset.c;
        const act=btn.dataset.act;
        const row=[...lessonWrap.children].filter(x=>!x.classList.contains("chapter")).slice((c-1)*5, (c-1)*5+5);
        row.forEach((p,i)=>{
          const key=`C${c}_B${i+1}`;
          const on = (act==="all");
          p.classList.toggle("active", on);
          if(on) selectedLessons.add(key); else selectedLessons.delete(key);
        });
        setDisabled(btnShuffle, selectedLessons.size===0);
      };
    });
  })();

  /* ==== LOADERS ==== */
  async function loadStudentsByClass(lop){
    try{
      const r=await fetch(`data/students_${lop}.json`,{cache:"no-cache"});
      if(!r.ok) throw new Error(`HTTP ${r.status} students_${lop}.json`);
      const data = await r.json();
      const arr = Array.isArray(data)?data:(data.students||[]);
      if(!Array.isArray(arr)||arr.length===0) throw new Error(`Empty students_${lop}.json`);
      return arr;
    }catch(e){ logErr(e.message); toastMsg("Không tải được danh sách HS!"); return []; }
  }
  async function loadQuestionsByBai(b){
    try{
      const r=await fetch(`data/questions_b${b}.json`,{cache:"no-cache"});
      if(!r.ok) throw new Error(`HTTP ${r.status} questions_b${b}.json`);
      const arr = await r.json();
      if(!Array.isArray(arr)||!arr.length) throw new Error(`Empty questions_b${b}.json`);
      return arr;
    }catch(e){ logErr(e.message); toastMsg(`Thiếu questions_b${b}.json`); return []; }
  }
  async function buildPoolFromSelected(){
    const setBai = new Set([...selectedLessons].map(k=>+k.split("_B")[1]));
    const data = await Promise.all([...setBai].map(b=>loadQuestionsByBai(b)));
    let merged=data.flat();
    // shuffle
    for(let i=merged.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [merged[i],merged[j]]=[merged[j],merged[i]]; }
    return merged;
  }

  /* ==== GỌI TÊN HS: 4s random → 3s giữ → thu nhỏ lên topbar ==== */
  btnCall.onclick = async ()=>{
    buzz(btnCall);
    const lop=(clsSel.value||"").toLowerCase();
    if(!lop){ toastMsg("Chọn lớp trước!"); return; }
    const list=await loadStudentsByClass(lop);
    if(!list.length) return;
    studentList=list;

    overlay.classList.remove("hide");
    let t=0;
    const spin=setInterval(()=>{
      bigName.textContent = studentList[Math.floor(Math.random()*studentList.length)];
      t+=100;
      if(t>=4000){
        clearInterval(spin);
        const finalName = studentList[Math.floor(Math.random()*studentList.length)];
        bigName.textContent = finalName;
        setTimeout(()=>{
          overlay.classList.add("hide");
          animateNameToTop(finalName);
        },3000);
      }
    },100);
  };

  function animateNameToTop(name){
    const ghost=document.createElement("div");
    ghost.textContent=name;
    Object.assign(ghost.style,{
      position:"fixed",left:"50%",top:"50%",transform:"translate(-50%,-50%)",
      fontSize:"72px",fontWeight:"900",color:"#ffeb3b",textShadow:"2px 2px 8px #000",zIndex:1000
    });
    document.body.appendChild(ghost);

    const topRect=studentTop.getBoundingClientRect();
    const gRect=ghost.getBoundingClientRect();
    const dx=topRect.left + topRect.width/2 - (gRect.left + gRect.width/2);
    const dy=topRect.top + topRect.height/2 - (gRect.top + gRect.height/2);
    const scale=.28;
    ghost.animate([
      {transform:"translate(-50%,-50%) scale(1)",opacity:1},
      {transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`,opacity:1}
    ],{duration:650,easing:"cubic-bezier(.2,.8,.2,1)"}).onfinish=()=>{
      ghost.remove();
      currentStudent=name; studentTop.textContent=name;
      updateStartButton();
    };
  }

  /* ==== TRỘN CÂU: hiệu ứng 3s + âm thanh ==== */
  btnShuffle.onclick = async ()=>{
    buzz(btnShuffle);
    if(selectedLessons.size===0){ toastMsg("Chọn ít nhất 1 bài!"); return; }
    setDisabled(btnShuffle,true); setDisabled(btnStart,true);

    // build pool trước
    pool = await buildPoolFromSelected();

    // FX
    fx.innerHTML=""; fx.classList.add("show");
    const chars="Σ∆πθλμxyz12345+=−×÷√αβγ";
    for(let i=0;i<40;i++){
      const s=document.createElement("span");
      s.className="symbol"; s.textContent=chars[Math.floor(Math.random()*chars.length)];
      s.style.left=Math.floor(Math.random()*100)+"vw";
      s.style.fontSize=(18+Math.random()*30)+"px";
      s.style.animationDelay=(Math.random()*0.9)+"s";
      fx.appendChild(s);
    }
    try{sfxShuffle?.play().catch(()=>{});}catch{}
    setTimeout(()=>{
      fx.classList.remove("show");
      toastMsg(`Đã trộn ${pool.length} câu`);
      setDisabled(btnShuffle,false);
      updateStartButton();
    },3000);
  };

  /* ==== TIMER ==== */
  function startTimer(sec){
    clearInterval(timer);
    let t=sec;
    bigTimer.textContent=String(t).padStart(2,"0");
    timer=setInterval(()=>{
      t--; bigTimer.textContent=String(t).padStart(2,"0");
      if(t<=0){ clearInterval(timer); timeUpReveal(); }
    },1000);
  }
  function timeUpReveal(){
    const ans=String(pool[idx].a ?? pool[idx].answer);
    document.querySelectorAll(".opt").forEach(o=>{
      if(o.dataset.val===ans) o.classList.add("correct");
      o.onclick=null;
    });
    btnConfirm.classList.add("hide");
    btnNext.classList.remove("hide");
    toastMsg("Hết giờ!");
  }

  /* ==== RENDER 1 CÂU ==== */
  async function renderQuestion(){
    if(idx>=pool.length){ endGame(); return; }
    const q=pool[idx];
    qtext.innerHTML = q.q || q.question || "—";
    if(window.MathJax?.typesetClear){ MathJax.typesetClear([qtext]); }
    if(window.MathJax?.typesetPromise){ await MathJax.typesetPromise([qtext]); }

    opts.innerHTML="";
    (q.options||q.choices||[]).slice(0,4).forEach(t=>{
      const div=document.createElement("div");
      div.className="opt"; div.dataset.val=String(t); div.textContent=t;
      div.onclick=()=>{
        document.querySelectorAll(".opt").forEach(x=>x.classList.remove("selected"));
        div.classList.add("selected");
        btnConfirm.classList.remove("hide");
        buzz(div);
      };
      opts.appendChild(div);
    });

    prog.textContent=`Câu ${idx+1}/${pool.length} — Điểm: ${score}`;
    btnConfirm.classList.remove("hide");
    btnNext.classList.add("hide");
    startTimer(timePerQ);
  }

  /* ==== START ==== */
  btnStart.onclick = async ()=>{
    buzz(btnStart);
    if(!currentStudent){ toastMsg("Gọi tên HS trước!"); return; }
    if(selectedLessons.size===0){ toastMsg("Chọn bài trước!"); return; }

    timePerQ=clamp(+document.getElementById("time").value||60,10,180);
    numQ = clamp(+document.getElementById("num").value||10,1,100);

    if(!pool.length) pool=await buildPoolFromSelected();
    pool=pool.slice(0,Math.min(numQ,pool.length));

    idx=0; score=0;
    setDisabled(btnCall,true);
    setDisabled(btnShuffle,true);
    setDisabled(btnEnd,false);

    hint.classList.add("hide");
    card.classList.remove("hide");
    renderQuestion();
    updateStartButton();
  };

  /* ==== XÁC NHẬN ==== */
  btnConfirm.onclick=()=>{
    buzz(btnConfirm);
    const sel=document.querySelector(".opt.selected");
    if(!sel){ toastMsg("Chọn đáp án!"); return; }
    clearInterval(timer);

    const ans=String(pool[idx].a ?? pool[idx].answer);
    if(sel.dataset.val===ans){ sel.classList.add("correct"); score++; try{sfxCorrect?.play();}catch{} }
    else{ sel.classList.add("incorrect"); try{sfxWrong?.play();}catch{};
      document.querySelectorAll(".opt").forEach(o=>{ if(o.dataset.val===ans) o.classList.add("correct"); });
    }
    document.querySelectorAll(".opt").forEach(o=>o.onclick=null);
    btnConfirm.classList.add("hide");
    btnNext.classList.remove("hide");
    prog.textContent=`Câu ${idx+1}/${pool.length} — Điểm: ${score}`;
  };

  /* ==== CÂU TIẾP ==== */
  btnNext.onclick=()=>{ buzz(btnNext); idx++; renderQuestion(); };

  /* ==== KẾT THÚC ==== */
  function endGame(){
    clearInterval(timer);
    qtext.innerHTML=`<b>Kết thúc!</b> ${currentStudent?currentStudent+" ":""}được ${score}/${pool.length} điểm.`;
    if(window.MathJax?.typesetClear){ MathJax.typesetClear([qtext]); }
    if(window.MathJax?.typesetPromise){ MathJax.typesetPromise([qtext]); }
    opts.innerHTML="";
    btnConfirm.classList.add("hide");
    btnNext.classList.add("hide");
    btnReplay.classList.remove("hide");
    try{sfxClap?.play();}catch{}
  }
  btnEnd.onclick=()=>{ buzz(btnEnd); endGame(); };

  /* ==== CHƠI LẠI ==== */
  btnReplay.onclick=()=>{
    buzz(btnReplay);
    btnReplay.classList.add("hide");
    card.classList.add("hide");
    hint.classList.remove("hide");
    setDisabled(btnCall,false);
    setDisabled(btnShuffle, selectedLessons.size===0);
    setDisabled(btnEnd,true);
    pool=[]; score=0; idx=0; bigTimer.textContent="00";
    toastMsg("Đã sẵn sàng chơi lại");
  };

  /* ==== MUSIC ==== */
  bgmSelect.onchange=()=>{ bgm.src=bgmSelect.value||""; };
  musicToggle.onclick=()=>{
    buzz(musicToggle);
    try{
      if(!bgm.src){ toastMsg("Chọn nhạc nền trước!"); return; }
      if(bgm.paused){ bgm.play(); musicToggle.textContent="🔊"; }
      else{ bgm.pause(); musicToggle.textContent="🔈"; }
    }catch(e){ logErr("Không phát được nhạc (trình duyệt chặn autoplay)"); }
  };

  /* ==== DRAG + MIN/MAX WINDOW ==== */
  (function dragWin(){
    const win=document.getElementById("cfg"), bar=document.getElementById("cfgBar");
    let sx=0,sy=0,dx=0,dy=0,drag=false,maxed=false,chip=null;
    bar.addEventListener("mousedown",e=>{drag=true;sx=e.clientX;sy=e.clientY;dx=win.offsetLeft;dy=win.offsetTop;});
    document.addEventListener("mousemove",e=>{ if(!drag||maxed) return; win.style.left=dx+(e.clientX-sx)+"px"; win.style.top=dy+(e.clientY-sy)+"px"; });
    document.addEventListener("mouseup",()=>drag=false);

    const wMin=document.getElementById("wMin");
    const wMax=document.getElementById("wMax");
    wMin.onclick=()=>{
      buzz(wMin);
      if(win.classList.contains("hide")) return;
      win.classList.add("hide");
      chip=document.createElement("div");
      chip.className="task-chip"; chip.textContent="⚙️ Cấu hình";
      chip.onclick=()=>{ win.classList.remove("hide"); chip.remove(); chip=null; };
      taskbar.appendChild(chip);
      toastMsg("Đã thu cửa sổ cấu hình");
    };
    wMax.onclick=()=>{
      buzz(wMax);
      maxed=!maxed;
      if(maxed){ win.style.left="10px"; win.style.top="60px"; win.style.width="calc(100% - 20px)"; }
      else{ win.style.width="680px"; }
    };
  })();

  /* ==== +/- INPUT ==== */
  document.querySelectorAll(".btn-mini").forEach(b=>{
    b.addEventListener("click",()=>{
      buzz(b);
      const t=b.dataset.t, d=+b.dataset.d;
      const el=document.getElementById(t==="time"?"time":"num");
      el.value = clamp(+el.value + d, t==="time"?10:1, t==="time"?180:100);
    });
  });

  document.getElementById("time").addEventListener("input",()=>{});
  document.getElementById("num").addEventListener("input",()=>{});

  /* ==== ĐỒNG HỒ ==== */
  setInterval(()=>{ document.getElementById("clock").textContent=new Date().toLocaleTimeString("vi-VN").slice(0,8); },1000);
});
