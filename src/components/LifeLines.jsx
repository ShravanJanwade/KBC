import React, { useState } from "react";
import "../styles/LifeLines.css";
import FiftyFifty from "./FiftyFifty";
import PhoneAFriend from "./PhoneAFriend";
import AudiencePoll from "./AudiencePoll";
import ExpertAdvice from "./ExpertAdvice";
import useSound from "use-sound";
import fiftyFiftySound from "../assets/fiftyfifty.mp3";
import phoneAFriendSound from "../assets/phone a friend.mp3";
import audiencePollSound from "../assets/Ask The Audience.mp3";
import expertAdviceSound from "../assets/Ask The Audience.mp3";

const Lifelines = ({
  gameData,
  questionNumber,
  setOptionColors,
  optionColors,
}) => {
  const [disabledLifelines, setDisabledLifelines] = useState({
    fiftyFifty: false,
    phoneAFriend: false,
    audiencePoll: false,
    expertAdvice: false,
  });
  const [playFiftyFifty] = useSound(fiftyFiftySound);
  const [playPhoneAFriend, { stop: stopPhoneAFriend }] =
    useSound(phoneAFriendSound);
  const [playAudiencePoll, { stop: stopAudiencePoll }] =
    useSound(audiencePollSound);
  const [playExpertAdvice] = useSound(expertAdviceSound);
  const disableLifeline = (lifeline) => {
    console.log(lifeline);
    console.log(disabledLifelines);
    setDisabledLifelines((prev) => ({
      ...prev,
      [lifeline]: true,
    }));
  };
  return (
    <div className="lifelines">
      <FiftyFifty
        question={gameData[questionNumber]}
        setOptionColors={setOptionColors}
        optionColors={optionColors}
        playSound={playFiftyFifty}
        disabled={disabledLifelines.fiftyFifty}
        disableLifeline={disableLifeline}
      />
      <PhoneAFriend
        gameData={gameData}
        questionNumber={questionNumber}
        playSound={playPhoneAFriend}
        stopSound={stopPhoneAFriend}
        disabled={disabledLifelines.phoneAFriend}
        disableLifeline={disableLifeline}
      />
      <AudiencePoll
        question={gameData[questionNumber]}
        playSound={playAudiencePoll}
        stopSound={stopAudiencePoll}
        disabled={disabledLifelines.audiencePoll}
        disableLifeline={disableLifeline}
      />
      <ExpertAdvice
        gameData={gameData}
        questionNumber={questionNumber}
        playSound={playExpertAdvice}
        disabled={disabledLifelines.expertAdvice}
        disableLifeline={disableLifeline}
      />
    </div>
  );
};

export default Lifelines;
