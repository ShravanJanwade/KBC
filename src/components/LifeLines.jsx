import React from "react";
import "../styles/LifeLines.css";
import FiftyFifty from "./FiftyFifty";
import PhoneAFriend from "./PhoneAFriend";
import AudiencePoll from "./AudiencePoll";
import ExpertAdvice from "./ExpertAdvice";

const Lifelines = ({
  gameData,
  questionNumber,
  setOptionColors,
  optionColors,
}) => {
  return (
    <div className="lifelines">
      <FiftyFifty
        question={gameData[questionNumber]}
        setOptionColors={setOptionColors}
        optionColors={optionColors}
        disabled
      />
      <PhoneAFriend gameData={gameData} questionNumber={questionNumber} />
      <AudiencePoll question={gameData[questionNumber]} />
      <ExpertAdvice gameData={gameData} questionNumber={questionNumber} />
    </div>
  );
};

export default Lifelines;
