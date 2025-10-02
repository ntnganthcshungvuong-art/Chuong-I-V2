let students = [];
let currentStudent = "";
let questions = [];
let currentQ = 0;
let score = 0;
let timeLeft = 0;
let timerInterval;

const studentNameSpan = document.getElementById("studentName");
const overlay = document.getElementById("nameOverlay");
const overlayName = document.getElementById("overlayName");

document.getElementById("classSelect").addEventListener("change", loadStudents);
document.getElementById("callNameBtn").addEventListener("click", callRandomStudent);
document.getElementById("shuffleBtn").addEventListener("click", shuffleQuestions);
document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("confirmBtn").addEventListener("click", confirmAnswer);
document.getElementById("nextBtn").addEventListener("click", nextQuestion);
document.getElementById("endBtn").addEventListener("click", endGame);
document.getElementById("retryBtn").addEventListener("click", resetGame);

async function loadStudents() {
  const cls = document.getElementById("classSelect").value;
  if (!cls) return;
  const res = await fetch(`data/students_${cls}.json`);
  const data = await res.json();
  students = data.students;
}

// Hiệu ứng gọi tên HS
async function callRandomStudent() {
  if (students.length === 0) {
    alert("Danh sách học sinh trống!");
    return;
  }
  overlay.classList.remove("hidden");

  let count = 0;
  let interval = setInterval(() => {
    const rand = students[Math.floor(Math.random() * students.length)];
    overlayName.textContent = rand;
    count++;
  }, 150);

  setTimeout(() => {
    clearInterval(interval);
    currentStudent = students[Math.floor(Math.random() * students.length)];
    overlayName.textContent = currentStudent;
    setTimeout(() => {
      overlay.classList.add("hidden");
      studentNameSpan.textContent = "Học sinh: " + currentStudent;
      document.getElementById("startBtn").disabled = false;
    }, 2000);
  }, 4000);
}

// Trộn câu hỏi (hiệu ứng shuffle)
function shuffleQuestions() {
  document.getElementById("shuffleBtn").textContent = "🔄 Đang trộn...";
  document.getElementById("shuffleBtn").disabled = true;

  setTimeout(() => {
    // shuffle logic
    questions = questions.sort(() => Math.random() - 0.5);
    document.getElementById("shuffleBtn").textContent = "Trộn câu ✔";
  }, 1500);
}

// Bắt đầu
async function startGame() {
  const res = await fetch(`data/questions_b1.json`);
  questions = await res.json();
  currentQ = 0;
  score = 0;
  showQuestion();
}

// Hiển thị câu hỏi
function showQuestion() {
  if (currentQ >= questions.length) {
    endGame();
    return;
  }
  const q = questions[currentQ];
  document.getElementById("questionText").innerHTML = q.q;
  MathJax.typeset(); // render công thức

  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerHTML = opt;
    btn.onclick = () => {
      document.querySelectorAll("#answers button").forEach(b => b.style.background = "#1f2937");
      btn.style.background = "#3b82f6";
      btn.dataset.selected = true;
      document.getElementById("confirmBtn").disabled = false;
    };
    answersDiv.appendChild(btn);
  });

  document.getElementById("progress").textContent = `Câu ${currentQ+1}/${questions.length} — Điểm: ${score}`;
}

// Xác nhận
function confirmAnswer() {
  const selected = document.querySelector("#answers button[style*='rgb(59, 130, 246)']");
  if (!selected) return;

  const q = questions[currentQ];
  if (selected.innerHTML === q.a) {
    score++;
    playSound("audio/correct.wav");
  } else {
    playSound("audio/wrong.wav");
  }

  document.getElementById("confirmBtn").disabled = true;
  document.getElementById("nextBtn").disabled = false;
}

// Câu tiếp
function nextQuestion() {
  currentQ++;
  document.getElementById("nextBtn").disabled = true;
  showQuestion();
}

// Kết thúc
function endGame() {
  document.getElementById("questionText").innerHTML =
    `Kết thúc! <b>${currentStudent}</b> được ${score}/${questions.length} điểm.`;
  document.getElementById("answers").innerHTML = "";
  document.getElementById("confirmBtn").disabled = true;
  document.getElementById("nextBtn").disabled = true;
  document.getElementById("retryBtn").classList.remove("hidden");
  playSound("audio/clap.wav");
}

// Reset
function resetGame() {
  document.getElementById("retryBtn").classList.add("hidden");
  startGame();
}

// Âm thanh
function playSound(src) {
  const audio = new Audio(src);
  audio.play();
}
