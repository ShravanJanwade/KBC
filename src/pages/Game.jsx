import React, { useState, useEffect } from "react";
import QuestionSection from "../components/QuestionSection";
import MoneySection from "../components/MoneySection";
import Lifelines from "../components/LifeLines"; // Assuming Lifelines component is correctly imported
import Timer from "../components/Timer";
import "../styles/Game.css";
import { gameData } from "../Data/GeneratedQuestions";
import backgroundImg from "../assets/MainImage.jpg";
import useSound from "use-sound";
import introSound from "../assets/LetPlay.mp3";
import question1to10Sound from "../assets/easyQuestion.mp3";
import question10to15Sound from "../assets/hardQuestions.mp3";
import finalQuestionsSound from "../assets/FinalAnswer.mp3";
import selectSound from "../assets/LetPlay.mp3";
import correctSound from "../assets/correctAnswer.mp3";
import wrongSound from "../assets/wrong answer.mp3";
import winSound from "../assets/winner.mp3";
import timerSound from "../assets/Time's Up.mp3"; // Import the timer sound
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Game = () => {
  const [questionNumber, setQuestionNumber] = useState(11);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [optionColors, setOptionColors] = useState({
    A: "",
    B: "",
    C: "",
    D: "",
  });
  const [resetTimer, setResetTimer] = useState(0);
  const [initialTime, setInitialTime] = useState(30); // Initial timer set to 30 seconds
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [prizeMoney, setPrizeMoney] = useState(0);

  const [playIntro, { stop: stopIntro }] = useSound(introSound);
  const [playQuestion1to10, { stop: stopQuestion1to10 }] =
    useSound(question1to10Sound);
  const [playQuestion10to15, { stop: stopQuestion10to15 }] =
    useSound(question10to15Sound);
  const [playFinalQuestions, { stop: stopFinalQuestions }] =
    useSound(finalQuestionsSound);
  const [playSelect, { stop: stopSelect }] = useSound(selectSound);
  const [playCorrect, { stop: stopCorrect }] = useSound(correctSound);
  const [playWrong, { stop: stopWrong }] = useSound(wrongSound);
  const [playWin, { stop: stopWin }] = useSound(winSound);
  const [playTimerSound, { stop: stopTimerSound }] = useSound(timerSound); // Setup the timer sound
  const navigate = useNavigate();

  const onReturnToMenu = () => {
    navigate("/Menu");
  };

  const stopAllSounds = () => {
    stopIntro();
    stopQuestion1to10();
    stopQuestion10to15();
    stopFinalQuestions();
    stopSelect();
    stopCorrect();
    stopWrong();
    stopWin();
    stopTimerSound(); // Stop the timer sound as well
  };

  const playSound = (sound) => {
    stopAllSounds();
    sound();
  };

  useEffect(() => {
    playSound(playIntro);
    return () => stopAllSounds();
  }, []);

  useEffect(() => {
    if (questionNumber < 5) {
      setInitialTime(30);
    } else if (questionNumber < 10) {
      setInitialTime(60);
    } else {
      setInitialTime(0); // No timer for questions after the 10th
    }
    setResetTimer((prev) => prev + 1);
  }, [questionNumber]);

  useEffect(() => {
    if (questionNumber < 10) {
      playSound(playQuestion1to10);
    } else if (questionNumber >= 10 && questionNumber < 14) {
      playSound(playQuestion10to15);
    } else if (questionNumber >= 14) {
      playSound(playFinalQuestions);
    }
  }, [questionNumber]);

  const handleTimeUp = () => {
    playSound(playTimerSound);
    setTimeout(() => {
      handleGameOver();
    }, 2000); // Give some time for the timer sound to play before showing the modal
  };

  const calculatePrizeMoney = () => {
    if (questionNumber >= 10) return 32000;
    if (questionNumber >= 5) return 1000;
    return 0;
  };

  const handleGameOver = () => {
    setPrizeMoney(calculatePrizeMoney());
    setShowGameOverModal(true);
  };

  const checkAnswer = (selectedOption) => {
    const correctAnswer = gameData[questionNumber].answer;
    const updatedColors = { ...optionColors, [selectedOption]: "orange" };
    setOptionColors(updatedColors);
    playSound(playSelect);
    setResetTimer((prev) => prev + 1); // Stop the timer

    setTimeout(() => {
      if (selectedOption === correctAnswer) {
        setOptionColors({ ...optionColors, [selectedOption]: "green" });
        playSound(playCorrect);
        setTimeout(() => {
          if (questionNumber === gameData.length - 1) {
            playSound(playWin);
            alert("You Won");
          } else {
            setQuestionNumber(questionNumber + 1);
            setSelectedAnswer("");
            setOptionColors({
              A: "",
              B: "",
              C: "",
              D: "",
            });
            setResetTimer((prev) => prev + 1); // Restart the timer
          }
        }, 2000);
      } else {
        setOptionColors({ ...optionColors, [selectedOption]: "red" });
        playSound(playWrong);
        setTimeout(() => {
          handleGameOver();
        }, 2000);
      }
    }, 2000);
  };

  return (
    <div
      className="game-container"
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Lifelines
        optionColors={optionColors}
        setOptionColors={setOptionColors}
        questionNumber={questionNumber}
        gameData={gameData}
      />
      <div className="main-content">
        {initialTime > 0 && (
          <Timer
            initialTime={initialTime}
            onTimeUp={handleTimeUp}
            reset={resetTimer}
          />
        )}
        <QuestionSection
          questionData={gameData[questionNumber]}
          setSelectedAnswer={setSelectedAnswer}
          checkAnswer={checkAnswer}
          optionColors={optionColors}
        />
        <MoneySection questionNumber={questionNumber + 1} />
      </div>

      <Modal
        show={showGameOverModal}
        onHide={() => setShowGameOverModal(false)}
        dialogClassName="tailwind-modal"
        backdropClassName="tailwind-backdrop"
      >
        <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-8 rounded-lg shadow-lg text-white">
          <Modal.Header closeButton className="border-b-0">
            <Modal.Title className="text-3xl font-bold">Game Over</Modal.Title>
          </Modal.Header>
          <Modal.Body className="py-4">
            <p className="text-xl">You won: ${prizeMoney}</p>
          </Modal.Body>
          <Modal.Footer className="border-t-0 justify-center">
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline"
              onClick={onReturnToMenu}
            >
              OK
            </button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
};

export default Game;
