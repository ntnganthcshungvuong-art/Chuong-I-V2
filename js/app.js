document.addEventListener("DOMContentLoaded", () => {
  const classSelect = document.getElementById("classSelect");
  const callNameBtn = document.getElementById("callName");
  const studentName = document.getElementById("studentName");
  const subjectBtns = document.querySelectorAll(".subject");
  const startBtn = document.getElementById("startBtn");
  const bgMusic = document.getElementById("bgMusic");
  const toggleMusicBtn = document.getElementById("toggleMusic");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const statusClass = document.getElementById("statusClass");
  const statusStudent = document.getElementById("statusStudent");
  const statusProgress = document.getElementById("statusProgress");
  const questionBox = document.getElementById("questionBox");
  const nextBtn = document.getElementById("nextBtn");
  const restartBtn = document.getElementById("restartBtn");

  let selectedClass = null;
  let selectedSubject = null;
  let selectedStudent = null;
  let shuffle = false;
  let questions = [];
  let current = 0;
  let score = 0;

  // Load học sinh từ file JSON
  async function loadStudents(classId) {
    try {
      const res = await fetch(`data/students_${classId}.json`);
      return await res.json();
    } catch (err) {
      return [];
    }
  }

  // Chọn lớp
  classSelect.addEventListener("change", (e) => {
    selectedClass = e.target.value;
    statusClass.textContent = "Lớp: " + selectedClass.toUpperCase();
  });

  // Gọi tên HS
  callNameBtn.addEventListener("click", async () => {
    if (!selectedClass) {
      studentName.textContent = "Chưa chọn lớp!";
      return;
    }
    const list = await loadStudents(selectedClass);
    if (list.length > 0) {
      selectedStudent = list[Math.floor(Math.random() * list.length)];
      studentName.textContent = selectedStudent;
      statusStudent.textContent = "Học sinh: " + selectedStudent;
    } else {
      studentName.textContent = "Chưa có dữ liệu học sinh!";
    }
  });

  // Chọn bài
  subjectBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      subjectBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSubject = btn.dataset.file;
      startBtn.disabled = false;
    });
  });

  // Bắt đầu
  startBtn.addEventListener("click", async () => {
    if (!selectedSubject) return;
    try {
      const res = await fetch("data/" + selectedSubject);
      questions = await res.json();
      if (shuffle) {
        questions = questions.sort(() => Math.random() - 0.5);
      }
      current = 0;
      score = 0;
      statusProgress.textContent = `Câu: 0/10 • Điểm: 0`;
      showQuestion();
      nextBtn.disabled = false;
    } catch (err) {
      alert("Lỗi tải dữ liệu: " + err);
    }
  });

  // Hiển thị câu hỏi
  function showQuestion() {
    if (current < 10 && current < questions.length) {
      const q = questions[current];
      questionBox.innerHTML = `<p><b>Câu ${current + 1}:</b> ${q.q}</p>`;
      statusProgress.textContent = `Câu: ${current + 1}/10 • Điểm: ${score}`;
    } else {
      questionBox.innerHTML = `<h3>🎉 Hoàn thành! Điểm: ${score}/10</h3>`;
      nextBtn.disabled = true;
    }
  }

  // Câu tiếp
  nextBtn.addEventListener("click", () => {
    current++;
    showQuestion();
  });

  // Chơi lại
  restartBtn.addEventListener("click", () => {
    location.reload();
  });

  // Toggle nhạc
  toggleMusicBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play();
      toggleMusicBtn.textContent = "Âm thanh: ON";
    } else {
      bgMusic.pause();
      toggleMusicBtn.textContent = "Âm thanh: OFF";
    }
  });

  // Trộn bài
  shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    shuffleBtn.textContent = "Trộn câu: " + (shuffle ? "ON" : "OFF");
  });
});
