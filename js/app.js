async function loadStudents(className) {
  try {
    const res = await fetch(`data/students_${className}.json`);
    const data = await res.json();
    return data.students || [];
  } catch (err) {
    alert("Không tải được danh sách lớp: " + className);
    return [];
  }
}

document.getElementById("callBtn").addEventListener("click", async () => {
  const classSelect = document.getElementById("classSelect");
  const className = classSelect.value;

  if (!className) {
    alert("Hãy chọn lớp trước!");
    return;
  }

  const students = await loadStudents(className);
  if (students.length === 0) {
    alert("Danh sách học sinh trống!");
    return;
  }

  // Hiệu ứng gọi tên random
  const display = document.getElementById("studentDisplay");
  display.style.display = "block";

  let i = 0;
  const interval = setInterval(() => {
    const randomName = students[Math.floor(Math.random() * students.length)];
    display.innerText = randomName;
    i++;
    if (i > 20) { // chạy khoảng 4 giây
      clearInterval(interval);
      // Giữ tên cuối 3 giây rồi ẩn
      setTimeout(() => {
        display.style.display = "none";
      }, 3000);
    }
  }, 200); // tốc độ random 200ms
});
