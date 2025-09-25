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

  // Chọn lớp
  classSelect.addEventListener("change", e => {
    selectedClass = e.target.value;
  });

  // Gọi tên học sinh
  callNameBtn.addEventListener("click", () => {
    if (selectedClass) {
      fetch(`data/students_${selectedClass}.json`)
        .then(res => res.json())
        .then(arr => {
          const name = arr[Math.floor(Math.random() * arr.length)];
          studentName.textContent = name;
        })
        .catch(err => {
          studentName.textContent = "⚠️ Không tải được danh sách lớp " + selectedClass;
        });
    } else {
      studentName.textContent = "⚠️ Chưa chọn lớp!";
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

  // Nút Bắt đầu
  startBtn.addEventListener("click", () => {
    if (selectedSubject) {
      fetch("data/" + selectedSubject)
        .then(res => res.json())
        .then(data => {
          let questions = data;
          if (shuffle) questions = questions.sort(() => Math.random() - 0.5);
          alert(`📘 Lớp: ${selectedClass || "?"}\n📖 Bài: ${selectedSubject}\n✅ Tải được ${questions.length} câu hỏi`);
        })
        .catch(err => alert("❌ Lỗi tải dữ liệu: " + err));
    }
  });

  // Bật / tắt nhạc
  toggleMusicBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play();
      toggleMusicBtn.textContent = "Âm thanh: ON";
    } else {
      bgMusic.pause();
      toggleMusicBtn.textContent = "Âm thanh: OFF";
    }
  });

  // Bật / tắt trộn câu
  shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    shuffleBtn.textContent = "Trộn câu: " + (shuffle ? "ON" : "OFF");
  });
});
