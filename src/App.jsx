import { useState, useRef, useEffect } from 'react';
import Hyperspeed from './Hyperspeed';
import './index.css';

function App() {
  const [selections, setSelections] = useState(() => {
    const initial = {};
    for(let i=12; i<=25; i++) initial[i] = new Set();
    return initial;
  });
  const [activeTable, setActiveTable] = useState(12);
  
  const [gameState, setGameState] = useState('setup'); // 'setup', 'quiz', 'complete'
  const [questionQueue, setQuestionQueue] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [answer, setAnswer] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const toggleMultiplier = (table, mult) => {
    setSelections(prev => {
      const newTableSet = new Set(prev[table]);
      if (newTableSet.has(mult)) {
        newTableSet.delete(mult);
      } else {
        newTableSet.add(mult);
      }
      return { ...prev, [table]: newTableSet };
    });
  };

  const toggleAllForTable = (table) => {
    setSelections(prev => {
      const currentSet = prev[table];
      const newSet = new Set();
      if (currentSet.size < 10) {
        for(let i=1; i<=10; i++) newSet.add(i);
      }
      return { ...prev, [table]: newSet };
    });
  };

  const getTotalSelected = () => {
    return Object.values(selections).reduce((acc, set) => acc + set.size, 0);
  };

  const startJourney = () => {
    const queue = [];
    for (const [tableStr, multSet] of Object.entries(selections)) {
      const table = parseInt(tableStr, 10);
      for (const mult of multSet) {
        const isReversed = Math.random() > 0.5;
        queue.push({
          num1: isReversed ? mult : table,
          num2: isReversed ? table : mult,
          answer: table * mult
        });
      }
    }
    
    if (queue.length === 0) return;
    
    // Fisher-Yates Shuffle
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    setTotalQuestions(queue.length);
    setScore(0);
    setQuestionQueue(queue);
    setCurrentQuestion(queue.pop());
    setGameState('quiz');
    setAnswer('');
    setFeedback({ message: '', type: '' });
    
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  const endQuiz = () => {
    setGameState('setup');
    setCurrentQuestion(null);
  };

  const checkAnswer = (e) => {
    if (e) e.preventDefault();
    if (answer.trim() === '') return;
    
    const userAnswer = parseInt(answer, 10);
    
    if (isNaN(userAnswer)) {
      setFeedback({ message: 'Please enter a valid number', type: 'error' });
      return;
    }

    if (userAnswer === currentQuestion.answer) {
      setScore(s => s + 1);
      setFeedback({ message: 'Awesome! 🌟', type: 'success' });
      
      setTimeout(() => {
        const nextQueue = [...questionQueue];
        if (nextQueue.length > 0) {
          const nextQ = nextQueue.pop();
          setQuestionQueue(nextQueue);
          setCurrentQuestion(nextQ);
          setAnswer('');
          setFeedback({ message: '', type: '' });
          if (inputRef.current) inputRef.current.focus();
        } else {
          setGameState('complete');
        }
      }, 1000);
    } else {
      setFeedback({ message: 'Not quite, try again!', type: 'error' });
      
      setShake(false);
      setTimeout(() => setShake(true), 10); // trigger reflow for animation
      
      if (inputRef.current) {
        inputRef.current.select();
      }
    }
  };

  return (
    <>
      <Hyperspeed
        effectOptions={{
          distortion: "turbulentDistortion",
          length: 400,
          roadWidth: 10,
          islandWidth: 2,
          lanesPerRoad: 3,
          fov: 90,
          fovSpeedUp: 150,
          speedUp: 2,
          carLightsFade: 0.4,
          totalSideLightSticks: 20,
          lightPairsPerRoadWay: 40,
          shoulderLinesWidthPercentage: 0.05,
          brokenLinesWidthPercentage: 0.1,
          brokenLinesLengthPercentage: 0.5,
          lightStickWidth: [0.12, 0.5],
          lightStickHeight: [1.3, 1.7],
          movingAwaySpeed: [60, 80],
          movingCloserSpeed: [-120, -160],
          carLightsLength: [12, 80],
          carLightsRadius: [0.05, 0.14],
          carWidthPercentage: [0.3, 0.5],
          carShiftX: [-0.8, 0.8],
          carFloorSeparation: [0, 5],
          colors: {
            roadColor: 0x0a0a0f,
            islandColor: 0x13141f,
            background: 0x000000,
            shoulderLines: 0x13141f,
            brokenLines: 0x13141f,
            leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
            rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
            sticks: 0x03b3c3
          }
        }}
      />
      
      <main className="glass-container">
        {gameState === 'setup' && (
          <section id="setup-screen" className="screen active">
            <header>
              <h1>Select Questions</h1>
              <p>Choose the specific tables and multipliers to master.</p>
            </header>
            
            <div className="setup-layout">
              <div className="table-sidebar">
                <h3>Tables</h3>
                <div className="table-grid-small">
                  {[...Array(14)].map((_, i) => {
                    const num = i + 12;
                    const selectedCount = selections[num]?.size || 0;
                    return (
                      <button
                        key={num}
                        className={`table-btn-small ${activeTable === num ? 'active' : ''} ${selectedCount > 0 ? 'has-selection' : ''}`}
                        onClick={() => setActiveTable(num)}
                      >
                        {num}
                        {selectedCount > 0 && <span className="badge">{selectedCount}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="multiplier-panel">
                <div className="multiplier-header">
                  <h3>Table of {activeTable}</h3>
                  <button className="text-btn" onClick={() => toggleAllForTable(activeTable)}>
                    {selections[activeTable]?.size === 10 ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="multiplier-grid">
                  {[...Array(10)].map((_, i) => {
                    const mult = i + 1;
                    const isSelected = selections[activeTable]?.has(mult);
                    return (
                      <button
                        key={mult}
                        className={`mult-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleMultiplier(activeTable, mult)}
                      >
                        × {mult}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <button
              id="start-btn"
              className="primary-btn mt-4"
              disabled={getTotalSelected() === 0}
              onClick={startJourney}
            >
              Start Journey ({getTotalSelected()} Qs)
            </button>
          </section>
        )}

        {gameState === 'quiz' && currentQuestion && (
          <section id="quiz-screen" className="screen active">
            <div className="quiz-header">
              <span className="score-display">Progress: <span id="score">{score} / {totalQuestions}</span></span>
              <button id="end-btn" className="text-btn" onClick={endQuiz}>End Quiz</button>
            </div>
            
            <div className="question-container">
              <h2 id="question" className="question-text">
                {currentQuestion.num1} × {currentQuestion.num2}
              </h2>
            </div>
            
            <form className="input-area" onSubmit={checkAnswer}>
              <div className={`input-wrapper ${shake ? 'shake' : ''}`} id="input-wrapper">
                <input
                  type="number"
                  id="answer-input"
                  placeholder="Type answer"
                  autoComplete="off"
                  inputMode="numeric"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  ref={inputRef}
                  autoFocus
                />
                <button type="submit" id="submit-btn" className="submit-btn" aria-label="Submit Answer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12L10 17L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div id="feedback" className={`feedback-text ${feedback.message ? 'show' : ''} ${feedback.type}`}>
                {feedback.message}
              </div>
            </form>
          </section>
        )}

        {gameState === 'complete' && (
          <section id="complete-screen" className="screen active">
            <header>
              <h1>Journey Complete!</h1>
              <p>You have mastered all selected questions.</p>
            </header>
            <div className="question-container">
              <h2 className="question-text" style={{ fontSize: '3.5rem', color: 'var(--success)', marginBottom: '16px' }}>
                {totalQuestions} Solved!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Flawless victory.</p>
            </div>
            <button className="primary-btn mt-4" onClick={() => setGameState('setup')}>
              Master More
            </button>
          </section>
        )}
      </main>
    </>
  );
}

export default App;
