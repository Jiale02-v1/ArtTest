const questionEl = document.getElementById("question");
const choicesEl = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");
const fileSelector = document.getElementById("fileSelector");
const quizSection = document.getElementById("quizSection");
const selectQuestions1Btn = document.getElementById("selectQuestions1");
const selectQuestions2Btn = document.getElementById("selectQuestions2");

let questions = [];
let currentQuestionIndex = -1;
let questionStats = {}; // Track correct answers for each question
let currentFile = "";

// File selection event listeners
selectQuestions1Btn.addEventListener("click", () => loadQuestions("data/questions.txt"));
selectQuestions2Btn.addEventListener("click", () => loadQuestions("data/questions2.txt"));

// 載入題庫
function loadQuestions(filename) {
  currentFile = filename;
  
  // Hide file selector and show quiz section
  fileSelector.style.display = "none";
  quizSection.style.display = "block";
  
  // Reset question stats
  questionStats = {};
  currentQuestionIndex = -1;
  
  fetch(filename)
    .then(res => res.text())
    .then(text => {
      console.log("Raw text loaded:", text.substring(0, 200) + "...");
      const result = parseQuestions(text);
      questions = result.questions;
      
      // Update the title
      if (result.title) {
        document.querySelector('h1').textContent = result.title;
        document.title = result.title;
      }
      
      console.log("Questions array:", questions);
      showNextQuestion();
    })
    .catch(err => {
      questionEl.textContent = "無法載入題目資料。";
      console.error("Error loading questions:", err);
    });
}

// 解析題庫格式
function parseQuestions(text) {
  const lines = text.trim().split("\n").filter(line => line.trim() !== "");
  const questionList = [];
  let title = "";

  lines.forEach((line, index) => {
    // 清理行尾空格
    line = line.trim();
    // console.log(`Processing line ${index + 1}: ${line}`);
    
    // First line is the title
    if (index === 0) {
      title = line;
      console.log(`Title extracted: ${title}`);
      return;
    }
    
    // 匹配格式，支援兩種問號和空格變化
    // 格式：1. (3) 桃的果實是由花的那一部位發育而成？①花托 ②花萼 ③子房 ④花柱
    const match = line.match(/^(\d+)\.\s*\((\d+)\)\s*(.*?)[\?？]\s*①\s*(.*?)\s*②\s*(.*?)\s*③\s*(.*?)\s*④\s*(.*)$/);
    if (match) {
      const questionId = parseInt(match[1], 10);
      const answerIndex = parseInt(match[2], 10) - 1; // 轉換為0-based索引
      const question = match[3].trim();
      const choices = [
        match[4].trim(),
        match[5].trim(), 
        match[6].trim(),
        match[7].trim()
      ];
      questionList.push({ 
        id: questionId, 
        question, 
        choices, 
        answer: answerIndex 
      });
      
      // Initialize tracking for this question
      questionStats[questionId] = { correctCount: 0 };
      
      // console.log(`Successfully parsed question ${match[1]}: ${question}`);
    } else {
      console.log(`Failed to match line ${index + 1}: ${line}`);
    }
  });

  console.log(`Total questions parsed: ${questionList.length}`);
  return { title, questions: questionList };
}

// 顯示下一題
function showNextQuestion() {
  clearUI();

  // Filter out questions that have been answered correctly 3 times
  const availableQuestions = questions.filter(q => questionStats[q.id].correctCount < 3);

  if (availableQuestions.length === 0) {
    questionEl.textContent = "恭喜！您已經完成所有題目！";
    console.log("All questions completed!");
    nextBtn.style.display = "none";
    return;
  }

  // Randomly select from available questions
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const selectedQuestion = availableQuestions[randomIndex];
  
  // Find the original index of this question in the questions array
  currentQuestionIndex = questions.findIndex(q => q.id === selectedQuestion.id);
  const q = questions[currentQuestionIndex];

  console.log(`Showing question ${q.id}: ${q.question} (correct count: ${questionStats[q.id].correctCount}/3)`);
  
  questionEl.textContent = q.question;
  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.classList.add("choice");
    btn.textContent = `${String.fromCharCode(9312 + idx)} ${choice}`;
    btn.addEventListener("click", () => handleAnswer(idx, q.answer, q.id));
    choicesEl.appendChild(btn);
  });
  
  // Show progress
  const remainingQuestions = availableQuestions.length;
  const totalQuestions = questions.length;
  const progressEl = document.createElement("div");
  progressEl.id = "progress";
  progressEl.textContent = `剩餘題目：${remainingQuestions}/${totalQuestions}`;
  document.querySelector('.container').appendChild(progressEl);
}

// 處理作答
function handleAnswer(selected, correct, questionId) {
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
  
  // Track correct answers
  if (selected === correct) {
    questionStats[questionId].correctCount++;
    console.log(`Question ${questionId} answered correctly! Count: ${questionStats[questionId].correctCount}/3`);
    
  } else {
    console.log(`Question ${questionId} answered incorrectly. Correct count remains: ${questionStats[questionId].correctCount}/3`);
  }
}

// 清除 UI
function clearUI() {
  questionEl.textContent = "";
  choicesEl.innerHTML = "";
  
  // Remove existing progress indicator
  const existingProgress = document.getElementById("progress");
  if (existingProgress) {
    existingProgress.remove();
  }
}

nextBtn.addEventListener("click", showNextQuestion);