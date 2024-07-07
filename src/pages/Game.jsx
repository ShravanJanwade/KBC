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

const Game = () => {
  const [questionNumber, setQuestionNumber] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [optionColors, setOptionColors] = useState({
    A: "",
    B: "",
    C: "",
    D: "",
  });
  const [resetTimer, setResetTimer] = useState(0);
  const [initialTime, setInitialTime] = useState(30); // Initial timer set to 30 seconds

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

  useEffect(() => {
    playIntro();
    return () => stopIntro();
  }, [playIntro, stopIntro]);

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
    stopIntro();
    stopQuestion1to10();
    stopQuestion10to15();
    stopFinalQuestions();

    if (questionNumber < 10) {
      playQuestion1to10();
    } else if (questionNumber >= 10 && questionNumber < 14) {
      playQuestion10to15();
    } else if (questionNumber >= 14) {
      playFinalQuestions();
    }
  }, [
    questionNumber,
    playQuestion1to10,
    playQuestion10to15,
    playFinalQuestions,
    stopIntro,
    stopQuestion1to10,
    stopQuestion10to15,
    stopFinalQuestions,
  ]);

  const handleTimeUp = () => {
    alert("Time's up! Moving to the next question.");
    setQuestionNumber((prev) => prev + 1);
    setSelectedAnswer("");
    setOptionColors({
      A: "",
      B: "",
      C: "",
      D: "",
    });
  };

  const checkAnswer = (selectedOption) => {
    const correctAnswer = gameData[questionNumber].answer;
    const updatedColors = { ...optionColors, [selectedOption]: "orange" };
    setOptionColors(updatedColors);
    stopSelect();
    playSelect();
    setResetTimer((prev) => prev + 1); // Stop the timer

    setTimeout(() => {
      stopSelect();
      if (selectedOption === correctAnswer) {
        console.log("Correct Answer");
        setOptionColors({ ...optionColors, [selectedOption]: "green" });
        playCorrect();
        setTimeout(() => {
          stopCorrect();
          if (questionNumber === gameData.length - 1) {
            playWin();
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
        console.log("Wrong Answer");
        setOptionColors({ ...optionColors, [selectedOption]: "red" });
        playWrong();
        setTimeout(() => {
          stopWrong();
          setOptionColors({
            A: "",
            B: "",
            C: "",
            D: "",
          });
          setQuestionNumber(questionNumber + 1);
          setResetTimer((prev) => prev + 1); // Restart the timer
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
        // marginLeft: "-200px",
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
    </div>
  );
};

export default Game;
