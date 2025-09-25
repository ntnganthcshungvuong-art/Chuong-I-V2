document.addEventListener("DOMContentLoaded", () => {
  const classSelect = document.getElementById("classSelect");
  const callNameBtn = document.getElementById("callName");
  const studentName = document.getElementById("studentName");
  const subjectBtns = document.querySelectorAll(".subject");
  const startBtn = document.getElementById("startBtn");
  const bgMusic = document.getElementById("bgMusic");
  const toggleMusicBtn = document.getElementById("toggleMusic");
  const shuffleBtn = document.getElementById("shuffleBtn");

  let selectedClass = null;
  let selectedSubject = null;
  let shuffle = false;
  let currentStudents = [];

  // Chọn lớp → load danh sách HS từ JSON
  classSelect.addEventListener("change", e => {
    selectedClass = e.target.value.toLowerCase();
    fetch(`data/students_${selectedClass}.json`)
      .then(res => res.json())
      .then(data => {
        currentStudents = data;
        studentName.textContent = `✅ Đã tải danh sách lớp ${e.target.value}`;
      })
      .catch(err => {
        currentStudents = [];
        studentName.textContent = "❌ Không tải được danh sách lớp!";
      });
  });

  // Gọi tên HS
  callNameBtn.addEventListener("click", () => {
    if (currentStudents.length > 0) {
      const name = currentStudents[Math.floor(Math.random() * currentStudents.length)];
      studentName.textContent = name;
    } else {
      studentName.textContent = "Chưa có dữ liệu học sinh!";
    }
  });

  // Chọn bài
  subjectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      subjectBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSubject = btn.dataset.file;
      startBtn.disabled = false;
    });
  });

  // Nút bắt đầu
  startBtn.addEventListener("click", () => {
    if (selectedSubject) {
      fetch("data/" + selectedSubject)
        .then(res => res.json())
        .then(data => {
          let questions = data;
          if (shuffle) questions = questions.sort(() => Math.random() - 0.5);
          alert(`📘 Lớp: ${selectedClass.toUpperCase()} | Bài: ${selectedSubject}\nTải được ${questions.length} câu hỏi`);
        })
        .catch(err => alert("❌ Lỗi tải dữ liệu: " + err));
    }
  });

  // Bật/tắt nhạc
  toggleMusicBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play();
      toggleMusicBtn.textContent = "Âm thanh: ON";
    } else {
      bgMusic.pause();
      toggleMusicBtn.textContent = "Âm thanh: OFF";
    }
  });

  // Trộn câu
  shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    shuffleBtn.textContent = "Trộn câu: " + (shuffle ? "ON" : "OFF");
  });
});
