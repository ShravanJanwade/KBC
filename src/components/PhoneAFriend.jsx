import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import logo from "../assets/phoneAFriend.png";
// Timer component
const Timer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft === 0) {
      onTimeUp();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp]);

  return <div className="text-center text-xl">{timeLeft} seconds left</div>;
};

const PhoneAFriend = ({
  gameData,
  questionNumber,
  playSound,
  stopSound,
  disabled,
  disableLifeline,
}) => {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("selectFriend");
  const [response, setResponse] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [timer, setTimer] = useState(30);

  const friends = [
    {
      name: "Alice",
      profession: "Engineer",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Bob",
      profession: "Doctor",
      image: "https://via.placeholder.com/150",
    },
    {
      name: "Charlie",
      profession: "Teacher",
      image: "https://via.placeholder.com/150",
    },
  ];

  const handleOpen = () => {
    playSound();
    setOpen(true);
    setStage("selectFriend");
    setResponse("");
    setSelectedFriend(null);
    setConversation([]);
    setTimer(30);
  };

  const handleClose = () => {
    stopSound();
    setOpen(false);
    disableLifeline("phoneAFriend");
  };

  const selectFriendHandler = (friend) => {
    setSelectedFriend(friend);
    setStage("dialing");
    setTimeout(() => setStage("communicating"), 5000);
  };

  const communicationHandler = () => {
    const friendResponse =
      Math.random() < 0.7
        ? gameData[questionNumber].answer
        : getRandomIncorrectAnswer();

    setResponse(
      `Your friend ${selectedFriend.name} suggests "${gameData[questionNumber].options[friendResponse]}"`
    );
    setStage("response");
  };

  const getRandomIncorrectAnswer = () => {
    const currentQuestion = gameData[questionNumber];
    const { answer } = currentQuestion;
    const options = Object.keys(currentQuestion.options);
    const incorrectOptions = options.filter((option) => option !== answer);
    const randomIndex = Math.floor(Math.random() * incorrectOptions.length);
    return incorrectOptions[randomIndex];
  };

  useEffect(() => {
    if (stage === "communicating") {
      setConversation([
        `Friend: Hello, this is ${selectedFriend.name}. How can I help you?`,
        "You: I need help with a question...",
        `You: ${gameData[questionNumber].question}`,
      ]);

      setTimeout(() => {
        setConversation((prev) => [...prev, "Friend: Let me think..."]);
        setTimeout(() => {
          communicationHandler();
          setConversation((prev) => [
            ...prev,
            `Friend: I think the answer is "${gameData[questionNumber].options[response]}".`,
          ]);
        }, 3000);
      }, 2000);
    }
  }, [stage]);

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
        <DialogHeader className="text-xl font-bold">
          Phone a Friend
        </DialogHeader>
        <DialogBody>
          {stage === "selectFriend" && (
            <div>
              <p className="text-lg mb-4">Select a friend to call:</p>
              <div className="grid grid-cols-3 gap-4">
                {friends.map((friend) => (
                  <div
                    key={friend.name}
                    className="flex flex-col items-center bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-green-500"
                    onClick={() => selectFriendHandler(friend)}
                  >
                    <img
                      src={friend.image}
                      alt={friend.name}
                      className="w-24 h-24 rounded-full mb-2"
                    />
                    <p className="text-lg font-semibold">{friend.name}</p>
                    <p className="text-sm">{friend.profession}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stage === "dialing" && (
            <div className="text-center">
              <p className="text-xl mb-4">Dialing {selectedFriend.name}...</p>
              <Timer duration={5} onTimeUp={() => setStage("communicating")} />
            </div>
          )}
          {stage === "communicating" && (
            <div>
              {conversation.map((line, index) => (
                <p key={index} className="mb-2">
                  {line}
                </p>
              ))}
              <Timer duration={timer} onTimeUp={communicationHandler} />
            </div>
          )}
          {stage === "response" && <p className="text-lg">{response}</p>}
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

export default PhoneAFriend;
