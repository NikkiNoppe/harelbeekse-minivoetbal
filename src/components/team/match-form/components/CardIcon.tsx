
import React from "react";

interface CardIconProps {
  type: "none" | "yellow" | "double_yellow" | "red";
}

const CardIcon: React.FC<CardIconProps> = ({ type }) => {
  if (type === "yellow") {
    return (
      <svg width="22" height="24" viewBox="0 0 22 24" aria-label="gele kaart" className="inline" style={{ verticalAlign: 'middle' }}>
        <rect x="2" y="5" width="14" height="18" rx="2" fill="#f9d923" stroke="#eed600" strokeWidth="2"/>
      </svg>
    );
  }
  if (type === "double_yellow") {
    return (
      <span className="inline-flex items-center" aria-label="twee gele kaarten">
        <svg width="13" height="22" viewBox="0 0 13 22">
          <rect x="1" y="5" width="9" height="13" rx="2" fill="#f9d923" stroke="#eed600" strokeWidth="2"/>
        </svg>
        <svg width="13" height="22" viewBox="0 0 13 22" style={{ marginLeft: "-6px" }}>
          <rect x="1" y="5" width="9" height="13" rx="2" fill="#f9d923" stroke="#eed600" strokeWidth="2"/>
        </svg>
      </span>
    );
  }
  if (type === "red") {
    return (
      <svg width="22" height="24" viewBox="0 0 22 24" aria-label="rode kaart" className="inline" style={{ verticalAlign: 'middle' }}>
        <rect x="2" y="5" width="14" height="18" rx="2" fill="#ed254e" stroke="#c21029" strokeWidth="2"/>
      </svg>
    );
  }
  return null;
};

export default CardIcon;

