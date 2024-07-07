import React from "react";

const FiftyFifty = ({ question, setOptionColors, optionColors }) => {
  const handleFiftyFifty = () => {
    const currentQuestion = question;
    const { answer } = currentQuestion;
    const options = Object.keys(currentQuestion.options);
    const incorrectOptions = options.filter((option) => option !== answer);
    const randomIndex1 = Math.floor(Math.random() * incorrectOptions.length);
    let randomIndex2 = Math.floor(Math.random() * incorrectOptions.length);
    while (randomIndex2 === randomIndex1) {
      randomIndex2 = Math.floor(Math.random() * incorrectOptions.length);
    }
    const hideOptions = [
      incorrectOptions[randomIndex1],
      incorrectOptions[randomIndex2],
    ];
    const updatedColors = { ...optionColors };
    hideOptions.forEach((option) => {
      updatedColors[option] = "gray";
    });
    setOptionColors(updatedColors);
  };
  return (
    <button className={`lifeline`} onClick={handleFiftyFifty}>
      50-50
    </button>
  );
};

export default FiftyFifty;
