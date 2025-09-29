document.addEventListener("DOMContentLoaded", () => {
  // ==== DOM ====
  const clsSel = document.getElementById("cls");
  const studentTop = document.getElementById("studentTop");
  const btnCall = document.getElementById("btnCall");
  const overlay = document.getElementById("overlay");
  const bigName = document.getElementById("bigName");

  const btnShuffle = document.getElementById("btnShuffle");
  const btnStart = document.getElementById("btnStart");
  const btnConfirm = document.getElementById("btnConfirm");
  const btnNext = document.getElementById("btnNext");
  const btnEnd = document.getElementById("btnEnd");
  const btnReplay = document.getElementById("btnReplay");

  const lessonWrap = document.getElementById("lessonWrap");
  const qtext = document.getElementById("qtext");
  const opts = document.getElementById("opts");
  const prog = document.getElementById("prog");
  const card = document.getElementById("card");
  const hint = document.getElementById("hint");

  const toastBox = document.getElementById("toast");
  const fx = document.getElementById("fx");
  const bigTimer = document.getElementById("bigTimer");

  // ==== State ====
  let students = {};
  let currentStudent = null;
  let hasStudent = false;
  let hasLesson = false;
  let selectedLessons = [];
  let questions = {};
  let qList = [];
  let qIndex = 0;
  let score = 0;
  let timer = null;
  let timePerQ = 60;
  let numQ = 10;

  // ==== Utils ====
  function showToast(msg) {
    toastBox.textContent = msg;
    toastBox.style.display = "block";
    setTimeout(() => (toastBox.style.display = "none"), 2000);
  }

  function updateStartButton() {
    btnStart.disabled = !(hasStudent && hasLesson);
  }

  function loadLessons() {
    for (let c = 1; c <= 5; c++) {
      for (let b = 1; b <= 5; b++) {
        const id = `C${c}_B${b}`;
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = id;
        input.addEventListener("change", () => {
          selectedLessons = Array.from(
            lessonWrap.querySelectorAll("input:checked")
          ).map((i) => i.value);
          hasLesson = selectedLessons.length > 0;
          updateStartButton();
          btnShuffle.disabled = !hasLesson;
        });
        label.appendChild(input);
        label.appendChild(document.createTextNode(`Ch ${c} - Bài ${b}`));
        lessonWrap.appendChild(label);
      }
    }
  }

  function startTimer(sec) {
    clearInterval(timer);
    let t = sec;
    bigTimer.textContent = t;
    timer = setInterval(() => {
      t--;
      bigTimer.textContent = t;
      if (t <= 0) {
        clearInterval(timer);
        lockOptions();
        btnConfirm.disabled = true;
        showToast("Hết giờ!");
      }
    }, 1000);
  }

  function renderQuestion() {
    if (qIndex >= qList.length) {
      endGame();
      return;
    }
    const q = qList[qIndex];
    qtext.innerHTML = q.q;
    opts.innerHTML = "";
    q.options.forEach((opt) => {
      const div = document.createElement("div");
      div.className = "opt";
      div.textContent = opt;
      div.onclick = () => {
        document
          .querySelectorAll(".opt")
          .forEach((o) => o.classList.remove("selected"));
        div.classList.add("selected");
      };
      opts.appendChild(div);
    });
    prog.textContent = `Câu ${qIndex + 1}/${qList.length} — Điểm: ${score}`;
    btnConfirm.classList.remove("hide");
    btnNext.classList.add("hide");
    startTimer(timePerQ);
  }

  function lockOptions() {
    document.querySelectorAll(".opt").forEach((o) => (o.onclick = null));
  }

  function endGame() {
    clearInterval(timer);
    qtext.innerHTML = `<b>Kết thúc!</b> Bạn được ${score}/${qList.length} điểm.`;
    opts.innerHTML = "";
    btnConfirm.classList.add("hide");
    btnNext.classList.add("hide");
    btnReplay.classList.remove("hide");
  }

  // ==== Events ====
  // Load students
  fetch("assets/data/students.json")
    .then((r) => r.json())
    .then((data) => {
      students = data;
      Object.keys(data).forEach((cls) => {
        let o = document.createElement("option");
        o.value = cls;
        o.textContent = cls;
        clsSel.appendChild(o);
      });
    });

  // Load questions
  fetch("assets/data/questions.json")
    .then((r) => r.json())
    .then((data) => (questions = data));

  // Lessons
  loadLessons();

  // Gọi tên HS
  btnCall.onclick = () => {
    if (!clsSel.value) {
      showToast("Chọn lớp trước");
      return;
    }
    const arr = students[clsSel.value];
    if (!arr) return;
    overlay.classList.remove("hide");
    let roll = setInterval(() => {
      bigName.textContent = arr[Math.floor(Math.random() * arr.length)];
    }, 100);
    setTimeout(() => {
      clearInterval(roll);
      currentStudent = arr[Math.floor(Math.random() * arr.length)];
      bigName.textContent = currentStudent;
      setTimeout(() => {
        overlay.classList.add("hide");
        studentTop.textContent = currentStudent;
        hasStudent = true;
        updateStartButton();
      }, 3000);
    }, 4000);
  };

  // Trộn bài
  btnShuffle.onclick = () => {
    if (!hasLesson) return;
    fx.classList.remove("hide");
    fx.textContent = "ĐANG TRỘN...";
    new Audio("assets/audio/shuffle.mp3").play();
    setTimeout(() => {
      fx.classList.add("hide");
      showToast("Đã trộn câu!");
    }, 3000);
  };

  // Bắt đầu
  btnStart.onclick = () => {
    if (!(hasStudent && hasLesson)) {
      showToast("Hãy gọi HS & chọn bài");
      return;
    }
    timePerQ = parseInt(document.getElementById("time").value) || 60;
    numQ = parseInt(document.getElementById("num").value) || 10;

    // gom câu hỏi từ lesson
    qList = [];
    selectedLessons.forEach((id) => {
      if (questions[id]) qList.push(...questions[id]);
    });
    qList = qList.sort(() => Math.random() - 0.5).slice(0, numQ);

    qIndex = 0;
    score = 0;
    card.classList.remove("hide");
    hint.classList.add("hide");
    renderQuestion();
  };

  // Xác nhận
  btnConfirm.onclick = () => {
    const sel = document.querySelector(".opt.selected");
    if (!sel) {
      showToast("Chọn đáp án!");
      return;
    }
    const ans = qList[qIndex].a;
    if (sel.textContent === ans) {
      sel.classList.add("correct");
      score++;
      new Audio("assets/audio/click.mp3").play();
    } else {
      sel.classList.add("incorrect");
      document
        .querySelectorAll(".opt")
        .forEach((o) => {
          if (o.textContent === ans) o.classList.add("correct");
        });
    }
    lockOptions();
    clearInterval(timer);
    btnConfirm.classList.add("hide");
    btnNext.classList.remove("hide");
    prog.textContent = `Câu ${qIndex + 1}/${qList.length} — Điểm: ${score}`;
  };

  // Câu tiếp
  btnNext.onclick = () => {
    qIndex++;
    renderQuestion();
  };

  // Kết thúc
  btnEnd.onclick = () => endGame();

  // Chơi lại
  btnReplay.onclick = () => {
    hasLesson = false;
    hasStudent = false;
    selectedLessons = [];
    studentTop.textContent = "—";
    document
      .querySelectorAll("#lessonWrap input")
      .forEach((i) => (i.checked = false));
    btnShuffle.disabled = true;
    updateStartButton();
    card.classList.add("hide");
    hint.classList.remove("hide");
    btnReplay.classList.add("hide");
  };

  // Đồng hồ realtime
  setInterval(() => {
    document.getElementById("clock").textContent = new Date()
      .toLocaleTimeString("vi-VN")
      .slice(0, 8);
  }, 1000);
});
