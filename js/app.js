// ========== Biến toàn cục ==========
let students = [];
let questions = [];
let currentQ = 0;
let score = 0;
let timer = null;
let timePerQ = 60;
let shuffleFX = null;

// DOM elements
const studentDisplay = document.getElementById("studentDisplay");
const questionBox = document.getElementById("questionBox");
const timerDisplay = document.getElementById("timerDisplay");
const shuffleFXBox = document.getElementById("shuffleFX");

// ========== Load dữ liệu ==========
async function loadStudents(className) {
  const file = `data/students_${className}.json`;
  try {
    const res = await fetch(file);
    students = await res.json();
  } catch (err) {
    console.error("Lỗi load HS:", err);
  }
}

async function loadQuestions(lesson) {
  const file = `data/questions_${lesson}.json`;
  try {
    const res = await fetch(file);
    questions = await res.json();
  } catch (err) {
    console.error("Lỗi load câu hỏi:", err);
  }
}

// ========== Gọi tên HS ==========
function callStudent() {
  if (!students.length) {
    alert("Chưa có danh sách HS!");
    return;
  }
  let idx = 0;
  studentDisplay.classList.remove("hide");
  const interval = setInterval(() => {
    studentDisplay.textContent = students[idx % students.length].name;
    idx++;
  }, 200);

  setTimeout(() => {
    clearInterval(interval);
    const final = students[Math.floor(Math.random() * students.length)].name;
    studentDisplay.textContent = final;
    setTimeout(() => studentDisplay.classList.add("hide"), 3000);
  }, 4000);
}

// ========== Hiển thị câu hỏi ==========
function showQuestion() {
  if (currentQ >= questions.length) {
    endGame();
    return;
  }
  const q = questions[currentQ];
  questionBox.innerHTML = `
    <div class="card">
      <div class="qtext">${q.q}</div>
      <div class="opts">
        ${q.options.map((opt, i) => `
          <button onclick="checkAnswer(this, '${opt}', '${q.a}')">${opt}</button>
        `).join("")}
      </div>
    </div>
  `;
  startTimer();
}

// ========== Đếm ngược ==========
function startTimer() {
  clearInterval(timer);
  let t = timePerQ;
  timerDisplay.textContent = t;
  timer = setInterval(() => {
    t--;
    timerDisplay.textContent = t;
    if (t <= 0) {
      clearInterval(timer);
      nextQ();
    }
  }, 1000);
}

// ========== Kiểm tra đáp án ==========
function checkAnswer(btn, chosen, correct) {
  const allBtns = btn.parentNode.querySelectorAll("button");
  allBtns.forEach(b => b.disabled = true);

  if (chosen === correct) {
    btn.classList.add("correct");
    score++;
    playSound("correct");
  } else {
    btn.classList.add("wrong");
    playSound("wrong");
  }
}

// ========== Câu tiếp ==========
function nextQ() {
  currentQ++;
  showQuestion();
}

// ========== Bắt đầu ==========
function startGame() {
  currentQ = 0;
  score = 0;
  showQuestion();
}

// ========== Kết thúc ==========
function endGame() {
  clearInterval(timer);
  questionBox.innerHTML = `
    <div class="card">
      <h2>Hoàn thành!</h2>
      <p>Điểm: ${score}/${questions.length}</p>
    </div>
  `;
  playSound("clap");
}

// ========== Trộn bài ==========
function shuffleQuestions() {
  if (!questions.length) {
    alert("Chưa chọn bài!");
    return;
  }
  shuffleFXBox.classList.remove("hide");
  shuffleFXBox.textContent = "Đang xáo...";
  setTimeout(() => {
    questions = questions.sort(() => Math.random() - 0.5);
    shuffleFXBox.classList.add("hide");
    toast("Đã trộn câu hỏi!");
  }, 3000);
}

// ========== Hiệu ứng toast ==========
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast show";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

// ========== Âm thanh ==========
function playSound(type) {
  const audio = new Audio(`audio/${type}.wav`);
  audio.play();
}

// ========== Gán nút ==========
document.getElementById("btnCall").onclick = callStudent;
document.getElementById("btnStart").onclick = startGame;
document.getElementById("btnNext").onclick = nextQ;
document.getElementById("btnShuffle").onclick = shuffleQuestions;
document.getElementById("btnEnd").onclick = endGame;
