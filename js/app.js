let students = {};
let currentStudent = "";
let selectedLessons = [];
let questions = [];
let timerInterval;

document.addEventListener("DOMContentLoaded", () => {
  loadStudentData();

  document.getElementById("callNameBtn").addEventListener("click", randomizeName);
  document.querySelectorAll(".lessonBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      updateLessons();
    });
  });
  document.getElementById("shuffleBtn").addEventListener("click", shuffleQuestions);
  document.getElementById("startBtn").addEventListener("click", startGame);
  document.getElementById("endBtn").addEventListener("click", endGame);
  document.getElementById("retryBtn").addEventListener("click", resetGame);

  setInterval(updateClock, 1000);
});

function loadStudentData() {
  const classes = ["8a1","8a2","8a3","8a4","8a5","8a6","8a7"];
  classes.forEach(cls => {
    fetch(`data/students_${cls}.json`)
      .then(res => res.json())
      .then(data => students[cls] = data.students);
  });
}

function randomizeName() {
  const cls = document.getElementById("classSelect").value;
  if (!cls || !students[cls]) {
    alert("Chưa có danh sách lớp!");
    return;
  }
  const names = students[cls];
  let i = 0;
  const box = document.getElementById("randomNameBox");
  box.classList.remove("hidden");
  const interval = setInterval(() => {
    box.textContent = names[Math.floor(Math.random() * names.length)];
    i++;
    if (i > 20) {
      clearInterval(interval);
      currentStudent = names[Math.floor(Math.random() * names.length)];
      document.getElementById("studentName").textContent = currentStudent;
      box.textContent = currentStudent;
      setTimeout(() => box.classList.add("hidden"), 3000);
      document.getElementById("startBtn").disabled = false;
    }
  }, 200);
}

function updateLessons() {
  selectedLessons = [];
  document.querySelectorAll(".lessonBtn.active").forEach(btn => {
    selectedLessons.push({chuong: btn.dataset.chuong, bai: btn.dataset.bai});
  });
}

function shuffleQuestions() {
  const btn = document.getElementById("shuffleBtn");
  btn.textContent = "🔄 Đang trộn...";
  setTimeout(() => btn.textContent = "🔄 Trộn câu", 1500);
}

function startGame() {
  document.getElementById("configPanel").classList.add("hidden");
  document.getElementById("questionBox").classList.remove("hidden");
  startTimer();
  loadQuestions();
}

function startTimer() {
  let time = parseInt(document.getElementById("timePerQuestion").value);
  const timer = document.getElementById("timer");
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer.textContent = time;
    time--;
    if (time < 0) clearInterval(timerInterval);
  }, 1000);
}

function loadQuestions() {
  const qBox = document.getElementById("questionText");
  const aBox = document.getElementById("answerOptions");
  qBox.innerHTML = "Ví dụ: \\( x^3 + \\frac{1}{x} \\)";
  MathJax.typeset();
  aBox.innerHTML = `
    <button>\\( x^3 + 1 \\)</button>
    <button>\\( x^2 + x + 1 \\)</button>
    <button>\\( \\frac{1}{x} + x \\)</button>
    <button>\\( 3x \\)</button>
  `;
  MathJax.typeset();
}

function endGame() {
  document.getElementById("resultBox").classList.remove("hidden");
  document.getElementById("resultBox").textContent = `${currentStudent} đã hoàn thành!`;
  document.getElementById("endBtn").disabled = true;
  document.getElementById("retryBtn").disabled = false;
}

function resetGame() {
  location.reload();
}

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent = now.toLocaleTimeString();
}
