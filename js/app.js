document.addEventListener('DOMContentLoaded', () => {
    // Game Elements
    const classDropdown = document.getElementById('class-dropdown');
    const randomStudentBtn = document.getElementById('random-student-btn');
    const studentNameDisplay = document.getElementById('student-name-display');
    const subjectButtons = document.querySelectorAll('.subject-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const startBtn = document.getElementById('start-btn');
    const studentNameOnScreen = document.getElementById('student-name-on-screen');
    const modal = document.getElementById('custom-modal');
    const modalText = document.getElementById('modal-text');
    const modalOkBtn = document.getElementById('modal-ok-btn');
    
    // Game State
    let selectedClass = null;
    let studentsData = {};
    let selectedStudent = null;
    let selectedSubjects = [];

    // Helper Functions
    const showModal = (text, onOk = () => {}) => {
        modalText.textContent = text;
        modal.style.display = 'flex';
        modalOkBtn.onclick = () => {
            modal.style.display = 'none';
            onOk();
        };
    };

    const checkIfReady = () => {
        if (selectedClass && selectedStudent && selectedSubjects.length > 0) {
            startBtn.disabled = false;
        } else {
            startBtn.disabled = true;
        }
    };

    const loadStudentData = async (className) => {
        try {
            const response = await fetch(`assets/data/students_${className.toLowerCase()}.json`);
            if (!response.ok) {
                // throw new Error(`Không tìm thấy dữ liệu học sinh cho lớp ${className}`);
                // Return an empty array to prevent fatal errors if file is not found
                return [];
            }
            const data = await response.json();
            studentsData[className] = data;
            return data;
        } catch (error) {
            showModal(`Lỗi: Không thể tải dữ liệu học sinh. Vui lòng kiểm tra lại đường dẫn tệp.`);
            return null;
        }
    };
    
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
    
    // Event Listeners
    classDropdown.addEventListener('change', async (e) => {
        selectedClass = e.target.value;
        document.getElementById('class-name-display').textContent = selectedClass;
        // Reset student name when class changes
        selectedStudent = null;
        studentNameDisplay.textContent = '...';
        studentNameOnScreen.textContent = '';
        checkIfReady();
        // Pre-load student data
        await loadStudentData(selectedClass);
    });

    randomStudentBtn.addEventListener('click', () => {
        if (!selectedClass) {
            showModal('Vui lòng chọn một lớp trước.');
            return;
        }
        const students = studentsData[selectedClass];
        if (students && students.length > 0) {
            let randomInterval;
            
            // Start randomizing names
            randomInterval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * students.length);
                studentNameOnScreen.textContent = students[randomIndex];
            }, 100);

            // Stop after 4 seconds
            setTimeout(() => {
                clearInterval(randomInterval);
                const randomIndex = Math.floor(Math.random() * students.length);
                selectedStudent = students[randomIndex];
                studentNameOnScreen.textContent = selectedStudent;
                studentNameDisplay.textContent = selectedStudent;
                checkIfReady();
            }, 4000);
            
            // playSound('suspense.mp3'); // Play suspense sound
        } else {
            showModal('Lớp này chưa có dữ liệu học sinh.');
        }
    });

    subjectButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const file = btn.dataset.file;
            const index = selectedSubjects.indexOf(file);
            if (index > -1) {
                btn.classList.remove('active');
                selectedSubjects.splice(index, 1);
            } else {
                btn.classList.add('active');
                selectedSubjects.push(file);
            }
            // playSound('button_click.mp3');
            checkIfReady();
        });
    });

    shuffleBtn.addEventListener('click', () => {
        if (selectedSubjects.length > 1) {
            selectedSubjects = shuffleArray(selectedSubjects);
            showModal('Các bài đã được trộn!');
            // playSound('shuffle.mp3');
        } else {
            showModal('Vui lòng chọn ít nhất 2 bài để trộn.');
        }
    });

    startBtn.addEventListener('click', () => {
        if (!selectedStudent) {
            showModal('Vui lòng gọi tên một học sinh trước.');
            return;
        }
        if (selectedSubjects.length === 0) {
            showModal('Vui lòng chọn ít nhất một bài học.');
            return;
        }
        
        // Final confirmation and start quiz logic
        showModal(`Sẵn sàng bắt đầu game!\nLớp: ${selectedClass}\nHọc sinh: ${selectedStudent}\nBài đã chọn: ${selectedSubjects.join(', ')}`, () => {
            // Logic để chuyển sang màn hình quiz
            document.getElementById('quiz-content').innerHTML = `<h1>Bắt đầu làm bài!</h1>`;
        });
    });

});