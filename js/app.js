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

  const students = {
    "8a5": ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"],
    "8a6": ["Phạm Văn D", "Hoàng Thị E", "Đỗ Văn F"]
  };

  classSelect.addEventListener("change", e => {
    selectedClass = e.target.value;
  });

  callNameBtn.addEventListener("click", () => {
    if (selectedClass && students[selectedClass]) {
      const arr = students[selectedClass];
      const name = arr[Math.floor(Math.random() * arr.length)];
      studentName.textContent = name;
    } else {
      studentName.textContent = "Chưa có dữ liệu học sinh";
    }
  });

  subjectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      subjectBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedSubject = btn.dataset.file;
      startBtn.disabled = false;
    });
  });

  startBtn.addEventListener("click", () => {
    if (selectedSubject) {
      fetch("assets/data/" + selectedSubject)
        .then(res => res.json())
        .then(data => {
          let questions = data;
          if (shuffle) questions = questions.sort(() => Math.random() - 0.5);
          alert("Tải được " + questions.length + " câu hỏi");
        })
        .catch(err => alert("Lỗi tải dữ liệu: " + err));
    }
  });

  toggleMusicBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play();
      toggleMusicBtn.textContent = "Âm thanh: ON";
    } else {
      bgMusic.pause();
      toggleMusicBtn.textContent = "Âm thanh: OFF";
    }
  });

  shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    shuffleBtn.textContent = "Trộn câu: " + (shuffle ? "ON" : "OFF");
  });
});
