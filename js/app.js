document.addEventListener("DOMContentLoaded", () => {
  const classSelect = document.getElementById("classSelect");
  const callNameBtn = document.getElementById("callName");
  const studentNameBox = document.getElementById("statusStudent");
  const bigName = document.getElementById("bigName");
  const subjectBtns = document.querySelectorAll(".subject");
  const startBtn = document.getElementById("startBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const statusSubjects = document.getElementById("statusSubjects");
  const questionsBox = document.getElementById("questionsBox");

  let selectedClass = null;
  let selectedSubjects = [];
  let shuffle = false;

  // Load học sinh từ JSON
  async function loadStudents(cls) {
    const res = await fetch(`data/students_${cls}.json`);
    return await res.json();
  }

  classSelect.addEventListener("change", e => {
    selectedClass = e.target.value;
    document.getElementById("statusClass").textContent = selectedClass.toUpperCase();
  });

  callNameBtn.addEventListener("click", async () => {
    if (!selectedClass) return;
    const students = await loadStudents(selectedClass);
    if (students.length === 0) return;

    let idx = 0;
    bigName.style.display = "block";

    const interval = setInterval(() => {
      bigName.textContent = students[Math.floor(Math.random() * students.length)];
      idx++;
      if (idx > 20) { // ~4 giây
        clearInterval(interval);
        const finalName = bigName.textContent;
        setTimeout(() => {
          bigName.style.display = "none";
          studentNameBox.textContent = finalName;
        }, 500);
      }
    }, 200);
  });

  subjectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      updateSubjects();
    });
  });

  function updateSubjects() {
    selectedSubjects = Array.from(subjectBtns)
      .filter(b => b.classList.contains("active"))
      .map(b => b.dataset.file);

    statusSubjects.textContent =
      selectedSubjects.length ? selectedSubjects.join(", ") : "--";

    startBtn.disabled = selectedSubjects.length === 0;
  }

  shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    shuffleBtn.textContent = "Trộn câu: " + (shuffle ? "ON" : "OFF");
  });

  startBtn.addEventListener("click", async () => {
    let allQuestions = [];
    for (let f of selectedSubjects) {
      try {
        const res = await fetch(`data/${f}`);
        const data = await res.json();
        allQuestions = allQuestions.concat(data);
      } catch (err) {
        console.error("Lỗi tải", f, err);
      }
    }
    if (shuffle) allQuestions.sort(() => Math.random() - 0.5);
    questionsBox.textContent =
      "Đã tải " + allQuestions.length + " câu hỏi từ " + selectedSubjects.length + " bài.";
  });
});
