
import { ArrowRight } from "lucide-react";
import { introduction } from "../data/storyData";

function Introduction({ onContinue }) {
  return (
    <div className="intro-screen">

      <p className="eyebrow">
        {introduction.chapter}
      </p>

      <h2 className="intro-heading">
        {introduction.heading}
      </h2>

      <div className="story-text">
        {introduction.paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={index === 2 ? "glitch-text" : ""}
          >
            {paragraph}
          </p>
        ))}
      </div>

      <p className="continue-note">
        {introduction.continueText}
      </p>

      <button
        className="start-button"
        onClick={onContinue}
      >
        CONTINUE
        <ArrowRight size={18} />
      </button>

    </div>
  );
}

export default Introduction;
