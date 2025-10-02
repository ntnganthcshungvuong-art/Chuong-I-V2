/* ====== Helpers ====== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const toastEl = $("#toast");
function toast(msg, ms=1600){
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  setTimeout(()=> toastEl.style.display = "none", ms);
}
function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

/* ====== State ====== */
let studentsByClass = {};           // cả HOA và thường
let currentStudent = "";
let selectedLessons = [];           // [{chuong:1,bai:3}, ...]
let allQuestions = [];              // pool câu hỏi
let currentIndex = 0;
let selectedAnswer = null;
let timeLeft = 0;
let timerId = null;
let shuffleQuestionFlag = false;

/* ====== Elements ====== */
const classSelect = $("#classSelect");
const callNameBtn = $("#callNameBtn");
const bigName = $("#bigName");
const studentHeader = $("#studentHeader");

const timeInput = $("#timePerQuestion");
const numInput  = $("#numQuestions");
const configPanel = $("#configPanel");

const shuffleLessonsBtn   = $("#shuffleLessonsBtn");
const shuffleQuestionsBtn = $("#shuffleQuestionsBtn");
const startBtn = $("#startBtn");

const questionCard = $("#questionCard");
const questionText = $("#questionText");
const answerOptions = $("#answerOptions");
const progressText = $("#progressText");

const floatingActions = $("#floatingActions");
const nextBtn = $("#nextBtn");
const endBtn = $("#endBtn");
const restartBtn = $("#restartBtn");

const spinner = $("#spinnerOverlay");
const sfxShuffle = $("#sfxShuffle");
const sfxClick   = $("#sfxClick");

/* ====== Build chapter selector ====== */
(function buildChapters(){
  const wrap = $("#chapterWrap");
  for(let c=1;c<=5;c++){
    const row = document.createElement("div");
    row.className = "chapterRow";
    row.innerHTML = `<span class="chapterTitle">Chương ${["I","II","III","IV","V"][c-1]}</span>
                     <span class="lessonWrap"></span>`;
    const lw = row.querySelector(".lessonWrap");
    for(let b=1;b<=5;b++){
      const btn = document.createElement("button");
      btn.className = "lessonBtn";
      btn.textContent = `Bài ${b}`;
      btn.dataset.chuong = String(c);
      btn.dataset.bai = String(b);
      btn.addEventListener("click", ()=>{
        btn.classList.toggle("active");
        updateSelectedLessons();
      });
      lw.appendChild(btn);
    }
    wrap.appendChild(row);
  }
})();

/* ====== Load students JSON (map HOA & thường) ====== */
(async function loadStudents(){
  for(let i=1;i<=7;i++){
    const keyLow = `8a${i}`; const keyUp = `8A${i}`;
    try{
      const res = await fetch(`data/students_${keyLow}.json`);
      const data = await res.json();
      const arr = data.students || [];
      studentsByClass[keyLow] = arr;
      studentsByClass[keyUp] = arr;
    }catch(e){
      // nếu thiếu file, copy tạm từ 8a5/8a6 nếu có
    }
  }
})();

/* ====== Clock ====== */
setInterval(()=>{
  const now = new Date();
  $("#headerClock").textContent = now.toLocaleTimeString();
}, 1000);

/* ====== Config arrows ====== */
$$("#configPanel .icon").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const type = btn.dataset.type;
    const dir  = Number(btn.dataset.dir);
    const input = (type==="time") ? timeInput : numInput;
    const min = Number(input.min), max = Number(input.max);
    let val = Number(input.value) + dir * (type==="time" ? 5 : 1);
    val = Math.max(min, Math.min(max, val));
    input.value = val;
  });
});

/* ====== Update selected lessons & start gating ====== */
function updateSelectedLessons(){
  selectedLessons = $$(".lessonBtn.active").map(b=>({chuong:Number(b.dataset.chuong), bai:Number(b.dataset.bai)}));
  gateStart();
}
function gateStart(){
  startBtn.disabled = !(currentStudent && selectedLessons.length>0);
}

/* ====== Call name (4s chạy / 3s giữ) ====== */
callNameBtn.addEventListener("click", ()=>{
  const cls = classSelect.value;
  const list = studentsByClass[cls?.toLowerCase?.() ? cls.toLowerCase() : cls];
  if(!cls){
    toast("Hãy chọn lớp trước!");
    return;
  }
  if(!list || list.length===0){
    toast("Chưa có danh sách lớp!");
    return;
  }
  // chạy random 4s
  bigName.style.display = "flex";
  let t = 0;
  const it = setInterval(()=>{
    bigName.textContent = randPick(list);
    t += 100;
    if(t>=4000){
      clearInterval(it);
      currentStudent = randPick(list);
      bigName.textContent = currentStudent;
      studentHeader.textContent = currentStudent;
      setTimeout(()=> bigName.style.display = "none", 3000);
      gateStart();
    }
  }, 100);
});

/* ====== Shuffle effects ====== */
function withSpinner(fn, ms=1600){
  spinner.classList.remove("hidden");
  sfxShuffle.currentTime = 0; sfxShuffle.play().catch(()=>{});
  setTimeout(async()=>{
    try{ await fn(); } finally {
      spinner.classList.add("hidden");
    }
  }, ms);
}

shuffleLessonsBtn.addEventListener("click", ()=>{
  if(selectedLessons.length===0){ toast("Hãy chọn ít nhất 1 bài!"); return; }
  withSpinner(()=>{ selectedLessons = shuffle(selectedLessons); toast("Đã trộn bài!"); });
});
shuffleQuestionsBtn.addEventListener("click", ()=>{
  shuffleQuestionFlag = true;
  withSpinner(()=> toast("Đã trộn câu!"));
});

/* ====== Load questions from selected lessons ====== */
async function buildQuestionPool(){
  const pool = [];
  // Tải theo 2 cách: (1) questions_chuong{c}.json rồi lọc theo bài; (2) questions_b{b}.json
  for(const item of selectedLessons){
    const {chuong, bai} = item;
    let pushed = false;

    // Cách (1)
    try{
      const r1 = await fetch(`data/questions_chuong${chuong}.json`);
      if(r1.ok){
        const data = await r1.json();
        (data.questions || data || []).forEach(q=>{
          // chấp nhận nhiều schema
          const bOfQ = q.bai || q.lesson || q.topic || q.Bai;
          if(Number(bOfQ) === Number(bai)){
            pool.push(normalizeQuestion(q));
            pushed = true;
          }
        });
      }
    }catch(_){}

    // Cách (2) – fallback
    if(!pushed){
      try{
        const r2 = await fetch(`data/questions_b${bai}.json`);
        if(r2.ok){
          const data2 = await r2.json();
          (data2.questions || data2 || []).forEach(q=> pool.push(normalizeQuestion(q)));
        }
      }catch(_){}
    }
  }

  // Nếu rỗng → tạo câu mẫu để không vỡ flow
  if(pool.length===0){
    pool.push(...[
      normalizeQuestion({question:"\\( x^2 + 2x + 1 = ? \\)", answers:["\\((x+1)^2\\)","\\(x^2+1\\)","\\(2x+1\\)","\\(x^2+2x\\)"], correctIndex:0}),
      normalizeQuestion({question:"\\( \\frac{1}{x} + x \\) là? ", answers:["Đơn thức","Nhị thức","Đa thức","Hằng số"], correctIndex:2})
    ]);
  }
  if(shuffleQuestionFlag) shuffle(pool);
  const limit = Number(numInput.value);
  return pool.slice(0, limit);
}

/* chuẩn hoá nhiều schema câu hỏi */
function normalizeQuestion(q){
  let question = q.question || q.q || q.text || "";
  let answers = q.answers || [q.a, q.b, q.c, q.d].filter(Boolean);
  let correctIndex = (typeof q.correctIndex==="number") ? q.correctIndex
                    : (typeof q.correct==="number") ? q.correct
                    : (typeof q.answer==="number") ? q.answer
                    : 0;
  return {question, answers, correctIndex};
}

/* ====== Start game ====== */
startBtn.addEventListener("click", async ()=>{
  if(startBtn.disabled) return;
  // build pool
  withSpinner(async()=>{
    allQuestions = await buildQuestionPool();
    currentIndex = 0;
    selectedAnswer = null;
    configPanel.classList.add("hidden");
    floatingActions.classList.remove("hidden");
    $("#restartBtn").classList.add("hidden");
    $("#endBtn").classList.remove("hidden");
    $("#questionCard").classList.remove("hidden");
    showQuestion();
    startTimerPerQuestion();
    toast("Bắt đầu!");
  }, 900);
});

/* ====== Render & interactions ====== */
function showQuestion(){
  const q = allQuestions[currentIndex];
  if(!q){ endGame(); return; }
  questionText.innerHTML = q.question;
  answerOptions.innerHTML = "";
  q.answers.forEach((ans,idx)=>{
    const btn = document.createElement("button");
    btn.className = "answerBtn";
    btn.innerHTML = ans;
    btn.addEventListener("click", ()=>{
      sfxClick.currentTime=0; sfxClick.play().catch(()=>{});
      $$(".answerBtn").forEach(b=> b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedAnswer = idx;
    });
    answerOptions.appendChild(btn);
  });
  progressText.textContent = `Câu ${currentIndex+1}/${allQuestions.length}`;
  // Math typeset
  if(window.MathJax?.typesetPromise) MathJax.typesetPromise();
}

function startTimerPerQuestion(){
  clearInterval(timerId);
  timeLeft = Number(timeInput.value);
  $("#headerTimer").textContent = timeLeft.toString().padStart(2,"0");
  timerId = setInterval(()=>{
    timeLeft--;
    $("#headerTimer").textContent = Math.max(0,timeLeft).toString().padStart(2,"0");
    if(timeLeft<=0){ goNext(); }
  },1000);
}

/* ====== Next / End / Restart ====== */
function goNext(){
  clearInterval(timerId);
  currentIndex++;
  selectedAnswer = null;
  if(currentIndex >= allQuestions.length){ endGame(); return; }
  showQuestion();
  startTimerPerQuestion();
}
nextBtn.addEventListener("click", goNext);

function endGame(){
  clearInterval(timerId);
  toast(`Kết thúc! ${currentStudent ? currentStudent : "Học sinh"} đã hoàn thành.`);
  $("#endBtn").classList.add("hidden");
  $("#restartBtn").classList.remove("hidden");
}
endBtn.addEventListener("click", endGame);

restartBtn.addEventListener("click", ()=>{
  // reset về cấu hình, giữ tên HS đã gọi
  floatingActions.classList.add("hidden");
  questionCard.classList.add("hidden");
  configPanel.classList.remove("hidden");
  selectedAnswer = null;
  currentIndex = 0;
  allQuestions = [];
  toast("Bạn có thể chọn lại bài hoặc trộn lại.");
});

/* ====== Accessibility small helpers ====== */
document.addEventListener("keydown",(e)=>{
  if(e.key==="Enter" && !startBtn.disabled && configPanel && !configPanel.classList.contains("hidden")){
    startBtn.click();
  }
});
