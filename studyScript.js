// Import Supabase client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
const SUPABASE_URL = 'https://ilqhnmthiaxcosvoxcre.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscWhubXRoaWF4Y29zdm94Y3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODI4ODMsImV4cCI6MjA3MTQ1ODg4M30.f7mmrV5AsQpAlu84vSGKpJBiUKtpu0eWjNapOeYVYGY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const modeSelect = document.getElementById('modeSelect');
const categorySelect = document.getElementById('categorySelect');
const dateInput = document.getElementById('dateInput');
const categoryDropdown = document.getElementById('categoryDropdown');
const studyDate = document.getElementById('studyDate');
const requiredCorrect = document.getElementById('requiredCorrect');
const startBtn = document.getElementById('startBtn');
const studyArea = document.querySelector('.study-area');
const questionText = document.getElementById('questionText');
const choicesArea = document.getElementById('choicesArea');
const completedCount = document.getElementById('completedCount');
const totalCount = document.getElementById('totalCount');
const currentCorrectCount = document.getElementById('currentCorrectCount');
const requiredCorrectDisplay = document.getElementById('requiredCorrectDisplay');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');

// State variables
let questions = [];
let currentQuestion = null;
let correctCounts = new Map(); // Map to store correct answer counts for each question
let remainingQuestions = [];

// Event Listeners
modeSelect.addEventListener('change', handleModeChange);
requiredCorrect.addEventListener('input', handleRequiredCorrectChange);
startBtn.addEventListener('click', startStudy);
nextQuestionBtn.addEventListener('click', () => {
    nextQuestionBtn.style.display = 'none';
    showNextQuestion();
});

// Initial setup
loadCategories();

// Handle mode change
function handleModeChange() {
    categorySelect.style.display = modeSelect.value === 'category' ? 'flex' : 'none';
    dateInput.style.display = modeSelect.value === 'date' ? 'flex' : 'none';
}

// Handle required correct count change
function handleRequiredCorrectChange() {
    requiredCorrectDisplay.textContent = requiredCorrect.value;
}

// Load categories from Supabase
async function loadCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('id, categoryname');
        
        if (error) throw error;

        categoryDropdown.innerHTML = data
            .map(cat => `<option value="${cat.id}">${cat.categoryname}</option>`)
            .join('');
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('无法加载项目列表');
    }
}

// Start study session
async function startStudy() {
    const mode = modeSelect.value;
    const requiredCorrectCount = parseInt(requiredCorrect.value);

    try {
        // Build query based on selected mode
        let query = supabase
            .from('questions')
            .select(`
                *,
                choices (
                    id,
                    choiceindex,
                    choicetext
                )
            `);

        if (mode === 'category') {
            query = query.eq('categoryid', categoryDropdown.value);
        } else if (mode === 'date') {
            const dateValue = studyDate.value;
            if (!isValidDate(dateValue)) {
                alert('请输入有效日期 (DD/MM/YYYY)');
                return;
            }
            const [day, month, year] = dateValue.split('/');
            const formattedDate = `${year}-${month}-${day}`;
            query = query.eq('studydate', formattedDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
            alert('没有找到符合条件的题目');
            return;
        }

        // Initialize the study session
        questions = data;
        correctCounts = new Map(questions.map(q => [q.id, 0]));
        remainingQuestions = [...questions];
        totalCount.textContent = questions.length;
        completedCount.textContent = '0';

        // Hide configuration and show study area
        document.querySelector('h1').style.display = 'none';
        document.querySelector('.study-config').style.display = 'none';
        studyArea.style.display = 'block';
        
        // Add a small session info header
        const sessionInfo = document.createElement('div');
        sessionInfo.classList.add('session-info');
        sessionInfo.innerHTML = `
            <div class="mode-info">${modeSelect.options[modeSelect.selectedIndex].text}</div>
            <div class="required-info">需答对 ${requiredCorrect.value} 次</div>
        `;
        document.querySelector('.container').insertBefore(sessionInfo, studyArea);

        showNextQuestion();

    } catch (error) {
        console.error('Error starting study session:', error);
        alert('开始学习时发生错误');
    }
}

// Show next question
function showNextQuestion() {
    // Hide the next question button
    nextQuestionBtn.style.display = 'none';
    
    if (remainingQuestions.length === 0) {
        alert('恭喜！您已完成所有题目！');
        // Show configuration screen again
        resetToConfig();
        return;
    }

    // Randomly select a question from remaining questions
    const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
    currentQuestion = remainingQuestions[randomIndex];

    // Display question
    questionText.textContent = currentQuestion.questiontext;
    currentCorrectCount.textContent = correctCounts.get(currentQuestion.id);

    // Sort and display choices
    const sortedChoices = currentQuestion.choices
        .sort((a, b) => a.choiceindex - b.choiceindex);

    choicesArea.innerHTML = sortedChoices
        .map((choice, idx) => `
            <div class="choice" data-index="${choice.choiceindex}">
                ${String.fromCharCode(9312 + idx)} ${choice.choicetext}
            </div>
        `)
        .join('');

    // Add click handlers to choices
    document.querySelectorAll('.choice').forEach(choice => {
        choice.addEventListener('click', handleAnswer);
    });
}

// Reset to configuration screen
function resetToConfig() {
    // Show configuration elements
    document.querySelector('h1').style.display = 'block';
    document.querySelector('.study-config').style.display = 'block';
    
    // Hide study elements
    studyArea.style.display = 'none';
    const sessionInfo = document.querySelector('.session-info');
    if (sessionInfo) {
        sessionInfo.remove();
    }
}

// Handle answer selection
function handleAnswer(event) {
    const selectedIndex = parseInt(event.currentTarget.dataset.index);
    const isCorrect = selectedIndex === currentQuestion.correctanswerindex;
    
    // Disable all choices
    document.querySelectorAll('.choice').forEach(choice => {
        choice.style.pointerEvents = 'none';
        if (parseInt(choice.dataset.index) === currentQuestion.correctanswerindex) {
            choice.classList.add('correct');
        } else if (parseInt(choice.dataset.index) === selectedIndex) {
            choice.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
    });

    if (isCorrect) {
        const currentCount = correctCounts.get(currentQuestion.id) + 1;
        correctCounts.set(currentQuestion.id, currentCount);

        if (currentCount >= parseInt(requiredCorrect.value)) {
            // Remove from remaining questions if completed
            remainingQuestions = remainingQuestions.filter(q => q.id !== currentQuestion.id);
            completedCount.textContent = questions.length - remainingQuestions.length;
        }
        
        // Update study history in Supabase
        updateStudyHistory(currentQuestion.id, true);
    } else {
        updateStudyHistory(currentQuestion.id, false);
    }

    // Show next question button
    nextQuestionBtn.style.display = 'block';
}

// Update study history in Supabase
async function updateStudyHistory(questionId, isCorrect) {
    try {
        const { error } = await supabase
            .from('studyhistory')
            .insert([{
                questionid: questionId,
                studydate: new Date().toISOString().split('T')[0],
                iscorrect: isCorrect
            }]);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating study history:', error);
    }
}

// Validate date format (DD/MM/YYYY)
function isValidDate(dateString) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(dateString)) return false;
    
    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
}