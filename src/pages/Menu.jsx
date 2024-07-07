import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import kbcLogo from "../assets/KBCLogo.webp";
import backgroundMusic from "../assets/MainTheme.mp3"; // Replace with your MP3 file path

const Menu = () => {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  const playGameHandler = () => {
    navigate("/Game");
  };

  const playBackgroundMusic = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        // Log and handle the error
        console.error("Failed to play background music:", error);
      });
    }
  };

  useEffect(() => {
    const handlePlay = () => {
      playBackgroundMusic();
      document.removeEventListener("click", handlePlay);
    };

    document.addEventListener("click", handlePlay);

    return () => {
      document.removeEventListener("click", handlePlay);
    };
  }, []);

  return (
    <div className="bg-gray-900 h-screen flex items-center justify-center">
      <div className="max-w-screen-xl w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left section with logo */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <img
              src={kbcLogo}
              alt="Who Wants to Be a Millionaire Logo"
              className="mx-auto max-w-full h-auto"
            />
          </div>
        </div>

        {/* Right section with options */}
        <div className="flex-1">
          <ul className="flex flex-col items-center space-y-4">
            <li
              className="bg-purple-600 text-white py-3 px-8 rounded-lg hover:bg-purple-700 transition duration-300 cursor-pointer"
              onClick={playGameHandler}
            >
              Play
            </li>
            <li className="bg-purple-600 text-white py-3 px-8 rounded-lg hover:bg-purple-700 transition duration-300 cursor-pointer">
              Profile
            </li>
            <li className="bg-purple-600 text-white py-3 px-8 rounded-lg hover:bg-purple-700 transition duration-300 cursor-pointer">
              Settings
            </li>
            <li className="bg-purple-600 text-white py-3 px-8 rounded-lg hover:bg-purple-700 transition duration-300 cursor-pointer">
              Rules
            </li>
            <li className="bg-purple-600 text-white py-3 px-8 rounded-lg hover:bg-purple-700 transition duration-300 cursor-pointer">
              Exit
            </li>
          </ul>
        </div>
      </div>
      <audio ref={audioRef} src={backgroundMusic} loop />
    </div>
  );
};

export default Menu;
