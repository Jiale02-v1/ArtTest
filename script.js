const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");

let questions = [];
let currentQuestionIndex = -1;

// 載入題庫
fetch("data/questions2.txt")
  .then(res => res.text())
  .then(text => {
    console.log("Raw text loaded:", text.substring(0, 200) + "...");
    questions = parseQuestions(text);
    console.log("Questions array:", questions);
    showNextQuestion();
  })
  .catch(err => {
    questionEl.textContent = "無法載入題目資料。";
    console.error("Error loading questions:", err);
  });

// 解析題庫格式
function parseQuestions(text) {
  const lines = text.trim().split("\n").filter(line => line.trim() !== "");
  const questionList = [];

  lines.forEach((line, index) => {
    // 清理行尾空格
    line = line.trim();
    console.log(`Processing line ${index + 1}: ${line}`);
    
    // 匹配格式，支援兩種問號和空格變化
    // 格式：1. (3) 桃的果實是由花的那一部位發育而成？①花托 ②花萼 ③子房 ④花柱
    const match = line.match(/^(\d+)\.\s*\((\d+)\)\s*(.*?)[\?？]\s*①\s*(.*?)\s*②\s*(.*?)\s*③\s*(.*?)\s*④\s*(.*)$/);
    if (match) {
      const answerIndex = parseInt(match[2], 10) - 1; // 轉換為0-based索引
      const question = match[3].trim();
      const choices = [
        match[4].trim(),
        match[5].trim(), 
        match[6].trim(),
        match[7].trim()
      ];
      questionList.push({ question, choices, answer: answerIndex });
      console.log(`Successfully parsed question ${match[1]}: ${question}`);
    } else {
      console.log(`Failed to match line ${index + 1}: ${line}`);
    }
  });

  console.log(`Total questions parsed: ${questionList.length}`);
  return questionList;
}

// 顯示下一題
function showNextQuestion() {
  clearUI();

  if (questions.length === 0) {
    questionEl.textContent = "沒有題目可顯示。";
    console.log("No questions available");
    return;
  }

  // 隨機選擇一個不同的題目
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * questions.length);
  } while (newIndex === currentQuestionIndex && questions.length > 1);
  
  currentQuestionIndex = newIndex;
  const q = questions[currentQuestionIndex];

  console.log(`Showing question ${currentQuestionIndex + 1}: ${q.question}`);
  
  questionEl.textContent = q.question;
  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.classList.add("choice");
    btn.textContent = `${String.fromCharCode(9312 + idx)} ${choice}`;
    btn.addEventListener("click", () => handleAnswer(idx, q.answer));
    choicesEl.appendChild(btn);
  });
}

// 處理作答
function handleAnswer(selected, correct) {
  const buttons = document.querySelectorAll(".choice");
  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correct) {
      btn.classList.add("correct");
    }
    if (idx === selected && selected !== correct) {
      btn.classList.add("incorrect");
    }
  });
}

// 清除 UI
function clearUI() {
  questionEl.textContent = "";
  choicesEl.innerHTML = "";
}

nextBtn.addEventListener("click", showNextQuestion);
