let students = [];
let questions = [];
let currentStudent = null;
let currentIndex = 0;
let score = 0;

const classSelect = document.getElementById('class');
const btnCall = document.getElementById('btnCall');
const studentName = document.getElementById('studentName');
const popupName = document.getElementById('popupName');

const checkboxes = document.querySelectorAll('.bai-list input');
const btnShuffle = document.getElementById('btnShuffle');
const btnStart = document.getElementById('btnStart');
const btnEnd = document.getElementById('btnEnd');
const btnConfirm = document.getElementById('btnConfirm');
const btnNext = document.getElementById('btnNext');

const questionBox = document.getElementById('questionBox');
const questionText = document.getElementById('questionText');
const answersDiv = document.getElementById('answers');

let timePerQ = document.getElementById('timePerQ');
let numQuestions = document.getElementById('numQuestions');

classSelect.addEventListener('change', () => {
  let val = classSelect.value;
  if (!val) return;
  fetch(`data/students_${val}.json`)
    .then(r => r.json())
    .then(data => {
      students = data.students;
      alert('Đã load danh sách lớp ' + val.toUpperCase());
    })
    .catch(() => {
      students = [];
      alert('Danh sách học sinh trống!');
    });
});

btnCall.addEventListener('click', () => {
  if (students.length === 0) {
    alert('Danh sách học sinh trống!');
    return;
  }
  let randIndex = Math.floor(Math.random() * students.length);
  currentStudent = students[randIndex];
  popupName.textContent = currentStudent;
  popupName.classList.remove('hidden');
  setTimeout(() => {
    popupName.classList.add('hidden');
    studentName.textContent = currentStudent;
  }, 4000);
});

btnShuffle.addEventListener('click', () => {
  const selectedBai = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
  if (selectedBai.length === 0) {
    alert('Chọn ít nhất 1 bài!');
    return;
  }
  questions = [];
  let promises = selectedBai.map(b => fetch(`data/questions_${b}.json`).then(r => r.json()));
  Promise.all(promises).then(results => {
    results.forEach(arr => { questions = questions.concat(arr); });
    questions = shuffleArray(questions);
    btnStart.disabled = false;
    playSound('shuffleAudio');
    alert('Đã trộn câu hỏi!');
  });
});

btnStart.addEventListener('click', () => {
  if (!currentStudent) { alert('Gọi tên HS trước!'); return; }
  currentIndex = 0; score = 0;
  btnEnd.disabled = false;
  showQuestion();
});

btnConfirm.addEventListener('click', () => {
  let chosen = document.querySelector('#answers button.active');
  if (!chosen) return;
  let correct = questions[currentIndex].a;
  if (chosen.dataset.answer === correct) {
    score++;
    chosen.style.background = 'green';
    playSound('correctAudio');
  } else {
    chosen.style.background = 'red';
    playSound('wrongAudio');
  }
  btnConfirm.disabled = true;
  btnNext.disabled = false;
});

btnNext.addEventListener('click', () => {
  currentIndex++;
  if (currentIndex < numQuestions.value && currentIndex < questions.length) {
    showQuestion();
  } else {
    alert(`Kết thúc! ${currentStudent} đạt ${score}/${currentIndex} điểm`);
    resetGame();
  }
});

btnEnd.addEventListener('click', () => {
  alert('Đã kết thúc sớm! ' + currentStudent + ' đạt ' + score + '/' + currentIndex);
  resetGame();
});

function showQuestion() {
  questionBox.classList.remove('hidden');
  let q = questions[currentIndex];
  questionText.textContent = q.q;
  answersDiv.innerHTML = '';
  q.options.forEach(opt => {
    let btn = document.createElement('button');
    btn.textContent = opt;
    btn.dataset.answer = opt;
    btn.onclick = () => {
      document.querySelectorAll('#answers button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      btnConfirm.disabled = false;
    };
    answersDiv.appendChild(btn);
  });
  btnConfirm.disabled = true;
  btnNext.disabled = true;
}

function resetGame() {
  questionBox.classList.add('hidden');
  btnStart.disabled = true;
  btnEnd.disabled = true;
  studentName.textContent = '—';
  currentStudent = null;
}

function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function playSound(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}
