import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
const ExpertAdvice = ({ gameData, questionNumber }) => {
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

  const handleOpen = () => setOpen(!open);

  return (
    <>
      <button className="lifeline" onClick={handleOpen}>
        Expert Advice
      </button>
      <Dialog
        open={open}
        onClose={handleOpen}
        size="md"
        className="bg-gray-900 text-white"
      >
        <DialogHeader className="text-xl font-bold text-white">
          Audience Poll
        </DialogHeader>
        <DialogBody>{gameData[questionNumber].question}</DialogBody>
        <DialogFooter>
          <Button onClick={handleOpen} className="bg-red-500 text-white">
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
};

export default ExpertAdvice;
