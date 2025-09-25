/* ========= Helpers ========= */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const DATA_PATH = "assets/data";

/** Fisher–Yates shuffle */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Safe fetch JSON + alert on error */
async function loadJSON(file) {
  try {
    const res = await fetch(`${DATA_PATH}/${file}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    alert(`❌ Lỗi tải file: ${file}`);
    console.error(err);
    return null;
  }
}

/* ========= DOM refs ========= */
const classSelect = $("#classSelect");
const btnCall = $("#btnCall");
const btnSound = $("#btnSound");
const btnShuffle = $("#btnShuffle");
const studentBox = $("#studentBox");

const lessons = $$(".lesson");
const btnStart = $("#btnStart");
const statusBox = $("#status");

const quizView = $("#quiz");
const quizClass = $("#quizClass");
const quizLesson = $("#quizLesson");
const quizProgress = $("#quizProgress");
const qText = $("#qText");
const answersBox = $("#answers");
const btnNext = $("#btnNext");
const btnRestart = $("#btnRestart");

/* Sounds */
const bgm = $("#bgm");
const sCorrect = $("#sCorrect");
const sWrong = $("#sWrong");

/* ========= State ========= */
let currentClass = "";
let currentLesson = "";
let shuffleOn = false;
let soundOn = true;

let students = [];        // danh sách tên cho lớp hiện tại
let questions = [];       // tất cả câu đã tải cho bài
let picks = [];           // 10 câu lấy ra
let idx = 0;              // câu hiện tại
let score = 0;

/* ========= Mapping file ========= */
const studentFile = (cls) => `students_${cls}.json`;
const lessonFile = {
  b1: "questions_b1.json",
  b2: "questions_b2.json",
  b3: "questions_b3.json",
  b4: "questions_b4.json",
  b5: "questions_b5.json",
  chuong1: "questions_chuong1.json",
};

/* ========= UI logic ========= */
// âm thanh
function setSoundUI() {
  btnSound.textContent = soundOn ? "ON" : "OFF";
  btnSound.classList.toggle("alt", !soundOn);
  if (soundOn) {
    bgm.volume = 0.5;
    bgm.play().catch(() => {});
  } else {
    bgm.pause();
  }
}
btnSound.addEventListener("click", () => {
  soundOn = !soundOn;
  setSoundUI();
});
// lần đầu click body thì bật bgm (policy)
document.body.addEventListener(
  "click",
  () => {
    if (bgm.paused && soundOn) bgm.play().catch(() => {});
  },
  { once: true }
);

// trộn
function setShuffleUI() {
  btnShuffle.textContent = shuffleOn ? "ON" : "OFF";
  btnShuffle.classList.toggle("alt", !shuffleOn);
}
btnShuffle.addEventListener("click", () => {
  shuffleOn = !shuffleOn;
  setShuffleUI();
});

// chọn lớp => tải students
classSelect.addEventListener("change", async (e) => {
  currentClass = e.target.value; // 8a5…
  students = [];
  if (!currentClass) {
    updateStatus();
    return;
  }
  const data = await loadJSON(studentFile(currentClass));
  students = Array.isArray(data) ? data : [];
  if (!students.length) alert(`⚠️ Lớp ${currentClass.toUpperCase()} chưa có danh sách.`);
  updateStatus();
});

btnCall.addEventListener("click", () => {
  if (!currentClass) return alert("⚠️ Chọn lớp trước đã nhé!");
  if (!students.length) return alert("⚠️ Lớp này chưa có danh sách!");
  const name = students[(Math.random() * students.length) | 0];
  studentBox.textContent = name;
  studentBox.classList.remove("hidden");
  studentBox.style.transform = "translateY(0) scale(1)";
});

// chọn bài
lessons.forEach((b) =>
  b.addEventListener("click", async () => {
    lessons.forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    currentLesson = b.dataset.lesson;
    updateStatus();
    // preload câu (nhanh hơn khi bấm bắt đầu)
    const file = lessonFile[currentLesson];
    const data = await loadJSON(file);
    questions = Array.isArray(data) ? data : [];
  })
);

function updateStatus() {
  const cls = currentClass ? currentClass.toUpperCase() : "—";
  const les = currentLesson
    ? (currentLesson === "chuong1" ? "Chương I" : currentLesson.toUpperCase())
    : "—";
  statusBox.textContent = `Lớp: ${cls} • Bài: ${les}`;
  btnStart.disabled = !(currentClass && currentLesson);
}

/* ========= Start quiz ========= */
btnStart.addEventListener("click", async () => {
  // đảm bảo có dữ liệu questions (nếu chưa preload)
  if (!questions.length) {
    const file = lessonFile[currentLesson];
    const data = await loadJSON(file);
    questions = Array.isArray(data) ? data : [];
  }
  if (!questions.length) return;

  let pool = [...questions];
  if (shuffleOn) pool = shuffle(pool);
  picks = pool.slice(0, 10);
  idx = 0;
  score = 0;

  // set header quiz
  quizClass.textContent = `Lớp: ${currentClass.toUpperCase()}`;
  quizLesson.textContent =
    "Bài: " + (currentLesson === "chuong1" ? "Chương I" : currentLesson.toUpperCase());

  // show quiz
  $(".card").classList.add("hidden");
  quizView.classList.remove("hidden");

  renderQuestion();
});

function renderQuestion() {
  if (idx >= picks.length) {
    qText.textContent = `Kết thúc! Bạn đạt ${score}/10 điểm.`;
    answersBox.innerHTML = "";
    btnNext.disabled = true;
    return;
  }

  const item = picks[idx]; // {q, a, options:[]}
  quizProgress.textContent = `Câu ${idx + 1}/10`;
  qText.innerHTML = item.q || "(Không có nội dung câu hỏi)";

  const opts = Array.isArray(item.options) ? [...item.options] : [];
  if (!opts.includes(item.a)) opts.push(item.a);
  shuffle(opts);

  answersBox.innerHTML = "";
  opts.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => checkAnswer(btn, opt, item.a));
    answersBox.appendChild(btn);
  });

  btnNext.disabled = true;
}

function checkAnswer(btn, value, correct) {
  const isOK = value === correct;
  if (isOK) {
    btn.classList.add("correct");
    if (soundOn) sCorrect.currentTime = 0, sCorrect.play().catch(() => {});
    score++;
  } else {
    btn.classList.add("wrong");
    if (soundOn) sWrong.currentTime = 0, sWrong.play().catch(() => {});
    // tô xanh đáp án đúng
    $$(".answers .btn").forEach((b) => {
      if (b.textContent === correct) b.classList.add("correct");
    });
  }
  // khóa lại tất cả
  $$(".answers .btn").forEach((b) => (b.disabled = true));
  btnNext.disabled = false;
}

btnNext.addEventListener("click", () => {
  idx++;
  renderQuestion();
});

btnRestart.addEventListener("click", () => {
  quizView.classList.add("hidden");
  $(".card").classList.remove("hidden");
  btnNext.disabled = false;
});
