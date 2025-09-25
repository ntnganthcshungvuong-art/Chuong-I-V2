document.addEventListener("DOMContentLoaded", () => {
  const classDropdown = document.getElementById("class-dropdown");
  const randomStudentBtn = document.getElementById("random-student-btn");
  const studentDisplay = document.getElementById("student-display");
  const subjectButtons = document.querySelectorAll(".subject-btn");
  const startBtn = document.getElementById("start-btn");
  const bgMusic = document.getElementById("bg-music");
  const toggleSoundBtn = document.getElementById("toggle-sound");

  let selectedClass = null;
  let selectedSubject = null;
  let studentsByClass = {};

  // Bật nhạc nền khi click lần đầu
  document.body.addEventListener("click", () => {
    if (bgMusic.paused) bgMusic.play();
  }, { once: true });

  // Bật/tắt âm thanh
  toggleSoundBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play();
      toggleSoundBtn.textContent = "Âm thanh: ON";
    } else {
      bgMusic.pause();
      toggleSoundBtn.textContent = "Âm thanh: OFF";
    }
  });

  // Load JSON helper
  async function loadJSON(file) {
    try {
      const res = await fetch(`data/${file}`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      alert(`❌ Lỗi tải file: ${file}`);
      return [];
    }
  }

  // Chọn lớp
  classDropdown.addEventListener("change", async (e) => {
    selectedClass = e.target.value;
    studentsByClass[selectedClass] = await loadJSON(`students_${selectedClass}.json`);
    studentDisplay.textContent = "";
    checkReady();
  });

  // Random học sinh
  randomStudentBtn.addEventListener("click", () => {
    const students = studentsByClass[selectedClass];
    if (students && students.length > 0) {
      const r = Math.floor(Math.random() * students.length);
      studentDisplay.textContent = students[r];
    } else {
      studentDisplay.textContent = "❌ Chưa có dữ liệu học sinh!";
    }
  });

  // Chọn bài
  subjectButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      subjectButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSubject = btn.dataset.subject;
      checkReady();
    });
  });

  // Kiểm tra bật nút start
  function checkReady() {
    startBtn.disabled = !(selectedClass && selectedSubject);
  }

  // Bắt đầu
  startBtn.addEventListener("click", async () => {
    if (selectedClass && selectedSubject) {
      const questions = await loadJSON(`questions_${selectedSubject}.json`);
      if (questions.length > 0) {
        alert(`✅ Lớp ${selectedClass.toUpperCase()} | Bài: ${selectedSubject}\nTải được ${questions.length} câu hỏi!`);
      } else {
        alert("❌ Không tải được câu hỏi!");
      }
    }
  });
});
