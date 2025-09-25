document.addEventListener("DOMContentLoaded", () => {
  const classSelect = document.getElementById("classSelect");
  const callNameBtn = document.getElementById("callName");
  const studentDisplay = document.getElementById("studentDisplay");
  const subjectBtns = document.querySelectorAll(".subject");
  const startBtn = document.getElementById("startBtn");
  const bgMusic = document.getElementById("bgMusic");
  const toggleMusicBtn = document.getElementById("toggleMusic");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const questionText = document.getElementById("questionText");
  const answersDiv = document.getElementById("answers");
  const nextBtn = document.getElementById("nextBtn");
  const restartBtn = document.getElementById("restartBtn");
  const classInfo = document.getElementById("classInfo");
  const studentInfo = document.getElementById("studentInfo");
  const subjectInfo = document.getElementById("subjectInfo");
  const progressInfo = document.getElementById("progressInfo");

  const shuffleSound = document.getElementById("shuffleSound");
  const correctSound = document.getElementById("correctSound");
  const wrongSound = document.getElementById("wrongSound");

  let selectedClass = "";
  let selectedStudent = "";
  let selectedSubjects = [];
  let questions = [];
  let currentIndex = 0;
  let score = 0;

  // Gọi tên HS từ file JSON
  callNameBtn.addEventListener("click", () => {
    if (!selectedClass) {
      alert("Chọn lớp trước!");
      return;
    }
    fetch(`data/students_${selectedClass}.json`)
      .then(res => res.json())
      .then(data => {
        let i = 0;
        const interval = setInterval(() => {
          studentDisplay.textContent = data[Math.floor(Math.random() * data.length)];
          i++;
          if (i > 20) {
            clearInterval(interval);
            selectedStudent = studentDisplay.textContent;
            studentInfo.textContent = "Học sinh: " + selectedStudent;
          }
        }, 200); // chạy random trong 4 giây
      });
  });

  // Chọn lớp
  classSelect.addEventListener("change", e => {
    selectedClass = e.target.value;
    classInfo.textContent = "Lớp: " + selectedClass.toUpperCase();
  });

  // Chọn bài
  subjectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      selectedSubjects = Array.from(subjectBtns)
        .filter(b => b.classList.contains("active"))
        .map(b => b.dataset.file);
      startBtn.disabled = selectedSubjects.length === 0;
    });
  });

  // Trộn câu
  shuffleBtn.addEventListener("click", () => {
    shuffleSound.play();
    if (questions.length > 0) {
      questions.sort(() => Math.random() - 0.5);
      alert("Đã trộn lại câu hỏi!");
    }
  });

  // Nhạc nền
  toggleMusicBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play();
      toggleMusicBtn.textContent = "Âm thanh: ON";
    } else {
      bgMusic.pause();
      toggleMusicBtn.textContent = "Âm thanh: OFF";
    }
  });

  // Bắt đầu
  startBtn.addEventListener("click", () => {
    if (selectedSubjects.length === 0) return;
    let promises = selectedSubjects.map(file =>
      fetch("data/" + file).then(res => res.json())
    );
    Promise.all(promises).then(allData => {
      questions = allData.flat();
      currentIndex = 0;
      score = 0;
      showQuestion();
    });
  });

  function showQuestion() {
    if (currentIndex >= questions.length) {
      questionText.textContent = "🎉 Hoàn thành! Điểm: " + score;
      answersDiv.innerHTML = "";
      return;
    }
    const q = questions[currentIndex];
    questionText.textContent = `Câu ${currentIndex + 1}: ${q.q}`;
    answersDiv.innerHTML = "";
    q.options.forEach(opt => {
      const btn = document.createElement("div");
      btn.className = "answer";
      btn.textContent = opt;
      btn.onclick = () => {
        if (opt === q.a) {
          btn.classList.add("correct");
          score++;
          correctSound.play();
        } else {
          btn.classList.add("wrong");
          wrongSound.play();
        }
        nextBtn.disabled = false;
        progressInfo.textContent = `Câu: ${currentIndex + 1}/10 • Điểm: ${score}`;
      };
      answersDiv.appendChild(btn);
    });
  }

  nextBtn.addEventListener("click", () => {
    currentIndex++;
    nextBtn.disabled = true;
    showQuestion();
  });

  restartBtn.addEventListener("click", () => {
    location.reload();
  });
});
