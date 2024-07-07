import React, { useEffect, useState } from "react";
import "../styles/Timer.css";

const Timer = ({ initialTime, onTimeUp, reset }) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [reset, initialTime]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  const radius = 54;
  const circumference = Math.PI * radius; // Half circle
  const progress = (timeLeft / initialTime) * circumference;

  return (
    <div className="timer-container">
      <svg className="timer-svg">
        <path
          className="timer-bg"
          d={`M 10,60 A 50,50 0 1,1 110,60`} // Semi-circle path
        ></path>
        <path
          className="timer-progress"
          d={`M 10,60 A 50,50 0 1,1 110,60`}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        ></path>
      </svg>
      <div className="timer-text">{timeLeft}</div>
    </div>
  );
};

export default Timer;
