import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTooltip } from "victory";
import logo from "../assets/audiencePoll.webp";
const AudiencePoll = ({
  question,
  playSound,
  stopSound,
  disabled,
  disableLifeline,
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    playSound();
    setOpen(true);
  };

  const handleClose = () => {
    stopSound();
    setOpen(false);
    disableLifeline("audiencePoll");
  };

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, [stopSound]);

  const options = Object.keys(question.options);

  const generatePollData = () => {
    // const correctAnswer = question.answer;
    const correctHighest = Math.random() < 0.99;

    let percentages = [];

    if (correctHighest) {
      const correctPercentage = Math.floor(Math.random() * 40) + 50;
      const remainingPercentage = 100 - correctPercentage;
      const incorrectPercentages = distributeRemainingPercentage(
        remainingPercentage,
        options.length - 1
      );
      percentages = [...incorrectPercentages, correctPercentage];
    } else {
      const incorrectPercentage = Math.floor(Math.random() * 50) + 30;
      const remainingPercentage = 100 - incorrectPercentage;
      const correctPercentage = Math.floor(
        Math.random() * (remainingPercentage / 3) * 2
      );
      const otherIncorrectPercentages = distributeRemainingPercentage(
        remainingPercentage - correctPercentage,
        options.length - 2
      );
      percentages = [
        correctPercentage,
        ...otherIncorrectPercentages,
        incorrectPercentage,
      ];
    }

    const shuffledPercentages = shuffle(percentages);
    const data = options.map((option, index) => ({
      option,
      percentage: shuffledPercentages[index],
    }));

    return data;
  };

  const distributeRemainingPercentage = (remaining, count) => {
    const percentages = [];
    for (let i = 0; i < count; i++) {
      percentages.push(Math.floor(remaining / (count - i)));
      remaining -= percentages[i];
    }
    return percentages;
  };

  const shuffle = (array) => {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  };

  return (
    <>
      <button
        className={`lifeline ${disabled ? "disabled" : ""}`}
        onClick={handleOpen}
        disabled={disabled}
      >
        {disabled && (
          <span className="cross-icon">
            <span className="line1"></span>
            <span className="line2"></span>
          </span>
        )}
        <img style={{ height: "50px", opacity: "0.7" }} src={logo} />
      </button>
      <Dialog
        open={open}
        onClose={handleClose}
        size="md"
        className="bg-gray-900 text-white"
      >
        <DialogHeader className="text-xl font-bold text-white">
          Audience Poll
        </DialogHeader>
        <DialogBody>
          <VictoryChart domainPadding={{ x: 50 }} height={300} width={400}>
            <VictoryAxis
              dependentAxis
              tickFormat={(tick) => `${tick}%`}
              style={{ tickLabels: { fill: "white" } }}
            />
            <VictoryAxis
              tickValues={[1, 2, 3, 4]}
              tickFormat={options.map((option) => option.toUpperCase())}
              style={{ tickLabels: { fill: "white" } }}
            />
            <VictoryBar
              data={generatePollData()}
              x="option"
              y="percentage"
              style={{
                data: {
                  fill: "#4caf50", // Green color for all bars
                },
              }}
              labels={({ datum }) =>
                `${datum.option}: ${datum.percentage.toFixed(2)}%`
              }
              labelComponent={
                <VictoryTooltip
                  style={{ fill: "white" }}
                  flyoutStyle={{ fill: "black" }}
                />
              }
            />
          </VictoryChart>
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleClose} className="bg-red-500 text-white">
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default AudiencePoll;
