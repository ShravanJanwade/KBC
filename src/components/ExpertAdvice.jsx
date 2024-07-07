import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
const ExpertAdvice = ({
  gameData,
  questionNumber,
  disabled,
  disableLifeline,
}) => {
  // const ExpertAdviceHandler = () => {
  //   console.log("Using Expert Advice lifeline");
  //   alert("Expert Advice lifeline activated.");
  //   const advice =
  //     Math.random() < 0.7
  //       ? gameData[questionNumber].answer
  //       : getRandomIncorrectAnswer();
  //   alert(`The expert advises "${gameData[questionNumber].options[advice]}"`);
  // };
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    console.log("Hello World");
  };
  const handleClose = () => {
    setOpen(false);
    console.log("Hello");
    disableLifeline("expertAdvice");
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
        Expert Advice
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
        <DialogBody>{gameData[questionNumber].question}</DialogBody>
        <DialogFooter>
          <Button onClick={handleClose} className="bg-red-500 text-white">
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default ExpertAdvice;
