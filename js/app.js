const studentNameEl = document.getElementById("studentName");
const callNameBtn = document.getElementById("callNameBtn");
const classSelect = document.getElementById("classSelect");
const studentLabel = document.getElementById("studentLabel");

const shuffleBtn = document.getElementById("shuffleBtn");
const startBtn = document.getElementById("startBtn");
const endBtn = document.getElementById("endBtn");
const restartBtn = document.getElementById("restartBtn");

const questionBox = document.getElementById("questionBox");
const questionText = document.getElementById("questionText");
const optionsEl = document.getElementById("options");
const progressEl = document.getElementById("progress");

// Fake data lớp
const classData = {
  "8A1": ["Nguyễn Văn A", "Trần Thị B"],
  "8A2": ["Phạm Văn C", "Hoàng Thị D"],
  "8A3": ["Nguyễn E", "Trần F"],
  "8A4": ["Nguyễn G", "Trần H"],
  "8A5": ["Nguyễn I", "Trần K"],
  "8A6": ["Nguyễn L", "Trần M"],
  "8A7": ["Nguyễn N", "Trần O"]
};

// ----------------- Gọi tên HS -----------------
callNameBtn.addEventListener("click", () => {
  const cls = classSelect.value;
  if (!cls || !classData[cls]) {
    alert("Chưa chọn lớp hoặc danh sách trống!");
    return;
  }
  let names = [...classData[cls]];
  let count = 0;
  const interval = setInterval(() => {
    studentNameEl.style.display = "block";
    studentNameEl.innerText = names[Math.floor(Math.random() * names.length)];
    count++;
    if (count > 20) { // chạy 20 lần ~ 2s
      clearInterval(interval);
      studentLabel.innerText = "Học sinh: " + studentNameEl.innerText;
    }
  }, 100);
});

// ----------------- Trộn câu -----------------
shuffleBtn.addEventListener("click", () => {
  shuffleBtn.innerText = "⏳ Đang trộn...";
  setTimeout(() => {
    shuffleBtn.innerText = "Trộn câu ✔";
    alert("Đã trộn xong!");
  }, 1500);
});

// ----------------- Bắt đầu -----------------
startBtn.addEventListener("click", () => {
  questionBox.classList.remove("hidden");
  questionText.innerHTML = "Đa thức bậc 2: \\( x^2 + 2x + 1 \\)";
  optionsEl.innerHTML = `
    <button>\\( (x+1)^2 \\)</button>
    <button>\\( x^2 + 1 \\)</button>
    <button>\\( x^2 + 2x \\)</button>
    <button>\\( 2x + 1 \\)</button>
  `;
  MathJax.typesetPromise();
});

// ----------------- Kết thúc & Chơi lại -----------------
endBtn.addEventListener("click", () => {
  questionBox.classList.add("hidden");
  restartBtn.style.display = "inline-block";
});

restartBtn.addEventListener("click", () => {
  restartBtn.style.display = "none";
  studentNameEl.style.display = "none";
  studentLabel.innerText = "Học sinh: --";
  questionBox.classList.add("hidden");
});
