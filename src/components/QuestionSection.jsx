import React from "react";
import "../styles/QuestionSection.css";

const QuestionSection = ({
  questionData,
  setSelectedAnswer,
  checkAnswer,
  optionColors,
}) => {
  const handleOptionClick = (option) => {
    setSelectedAnswer(option);
    checkAnswer(option);
  };

  return (
    <div className="question-section">
      <div className="question">{questionData.question}</div>
      <div className="options">
        <div
          className={`option ${optionColors.A}`}
          onClick={() => handleOptionClick("A")}
        >
          {optionColors.A !== "gray" ? `A. ${questionData.options.A}` : null}
        </div>
        <div
          className={`option ${optionColors.B}`}
          onClick={() => handleOptionClick("B")}
        >
          {optionColors.B !== "gray" ? `B. ${questionData.options.B}` : null}
        </div>
        <div
          className={`option ${optionColors.C}`}
          onClick={() => handleOptionClick("C")}
        >
          {optionColors.C !== "gray" ? `C. ${questionData.options.C}` : null}
        </div>
        <div
          className={`option ${optionColors.D}`}
          onClick={() => handleOptionClick("D")}
        >
          {optionColors.D !== "gray" ? `D. ${questionData.options.D}` : null}
        </div>
      </div>
    </div>
  );
};

export default QuestionSection;
