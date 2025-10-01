// Hiển thị thông báo nhỏ
function showToast(msg) {
  alert(msg); // bạn có thể thay bằng toast UI đẹp hơn
}

// Hiển thị tên HS to rõ giữa màn hình
function showStudentName(name) {
  const display = document.getElementById("studentDisplay");
  display.innerText = name;
  display.style.color = "yellow";
  display.style.fontSize = "48px";
  display.style.fontWeight = "bold";

  // Hiển thị 4 giây rồi biến mất (còn tên nhỏ trên topbar)
  setTimeout(() => {
    display.innerText = "";
  }, 4000);
}

// ================== SỰ KIỆN ==================

// Nút gọi tên HS
document.getElementById("pickStudent").addEventListener("click", () => {
  const classValue = document.getElementById("classSelect").value;
  if (!classValue) {
    showToast("Bạn chưa chọn lớp!");
    return;
  }

  fetch(`data/students_${classValue}.json`)
    .then(res => res.json())
    .then(data => {
      if (!data.length) {
        showToast("Danh sách học sinh trống!");
        return;
      }
      const randomName = data[Math.floor(Math.random() * data.length)];
      showStudentName(randomName);
    })
    .catch(err => {
      console.error(err);
      showToast("Không tìm thấy file học sinh cho lớp này!");
    });
});

// Nút trộn câu
document.getElementById("shuffleBtn").addEventListener("click", () => {
  showToast("Đang trộn câu hỏi...");
  document.getElementById("startBtn").disabled = false;
});

// Nút bắt đầu
document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("startBtn").disabled = true;
  document.getElementById("endBtn").disabled = false;
  document.getElementById("nextBtn").disabled = false;
  document.getElementById("confirmBtn").disabled = false;
  document.getElementById("quizArea").classList.remove("hidden");
  startTimer();
});

// Nút kết thúc
document.getElementById("endBtn").addEventListener("click", () => {
  if (confirm("Bạn có chắc muốn kết thúc?")) {
    resetQuiz();
  }
});

// ================== LOGIC QUIZ ==================
let timerInterval;
function startTimer() {
  let time = parseInt(document.getElementById("timePerQuestion").value) || 60;
  const timer = document.getElementById("timer");

  timer.innerText = time;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    time--;
    timer.innerText = time;
    if (time <= 0) {
      clearInterval(timerInterval);
      showToast("Hết giờ cho câu này!");
    }
  }, 1000);
}

function resetQuiz() {
  clearInterval(timerInterval);
  document.getElementById("quizArea").classList.add("hidden");
  document.getElementById("startBtn").disabled = false;
  document.getElementById("endBtn").disabled = true;
  document.getElementById("nextBtn").disabled = true;
  document.getElementById("confirmBtn").disabled = true;
}
