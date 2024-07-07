import React from "react";
import "../styles/MoneySection.css";

const moneyLevels = [
  "$1,000,000",
  "$500,000",
  "$250,000",
  "$125,000",
  "$64,000",
  "$32,000",
  "$16,000",
  "$8,000",
  "$4,000",
  "$2,000",
  "$1,000",
  "$500",
  "$300",
  "$200",
  "$100",
];

const MoneySection = ({ questionNumber }) => {
  return (
    <div className="money-section">
      {moneyLevels.map((level, index) => (
        <div
          key={index}
          className={`money-level ${
            index === moneyLevels.length - questionNumber ? "active" : ""
          }`}
        >
          {level}
        </div>
      ))}
    </div>
  );
};

export default MoneySection;
