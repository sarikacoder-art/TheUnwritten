import eliasPortrait from "../assets/elias-portrait.png";
import miloPortrait from "../assets/milo-portrait.png";
import forgottenPortrait from "../assets/forgotten-portrait.png";


import { useEffect, useRef, useState } from "react";
import {
    startGame,
    continueGame,
    submitChoice,
    talkToMilo,
    respondToForgotten,
    chooseEnding
} from "../services/gameAPI";
import {
    ArrowRight,
    Eye,
    Volume2,
    BookOpen,
    Brain,
    GitBranch,
    Shield,
    Store,
    Ghost,
    LockKeyhole,
    ChevronDown,
} from "lucide-react";

function Home() {
    const [started, setStarted] = useState(false);
    const [viewingInfo, setViewingInfo] = useState(false);
    const [pendingSection, setPendingSection] = useState("");

    const [sessionId, setSessionId] = useState(null);
    const [gameState, setGameState] = useState(null);
    const [currentScene, setCurrentScene] = useState("INTRODUCTION");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [miloDialogue, setMiloDialogue] = useState("");
    const [miloMood, setMiloMood] = useState("");
    const [forgottenDialogue, setForgottenDialogue] = useState("");
    const [forgottenNextScene, setForgottenNextScene] = useState("");
    const [chosenCharacter, setChosenCharacter] = useState("");
    const [ending, setEnding] = useState("");
    const [endingNarration, setEndingNarration] = useState("");

    const requestInFlight = useRef(false);

    // When a navigation link is clicked during gameplay, show the information
    // page temporarily and scroll to the requested section.
    const handleSectionNavigation = (event, sectionId) => {
        event.preventDefault();
        if (started) setViewingInfo(true);
        setPendingSection(sectionId);
    };

    useEffect(() => {
        if (!pendingSection) return;
        if (started && !viewingInfo) return;

        const section = document.getElementById(pendingSection);
        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setPendingSection("");
    }, [pendingSection, started, viewingInfo]);

    // Create a new game session
    const handleStart = async () => {
        if (requestInFlight.current) return;

        requestInFlight.current = true;
        setIsLoading(true);
        setError("");

        try {
            const data = await startGame();

            if (!data.sessionId || !data.gameState) {
                throw new Error("The server returned an incomplete game session.");
            }

            setSessionId(data.sessionId);
            setChosenCharacter("");
            setMiloDialogue("");
            setMiloMood("");
            setForgottenDialogue("");
            setForgottenNextScene("");
            setEnding("");
            setEndingNarration("");
            setViewingInfo(false);
            setGameState(data.gameState);
            setCurrentScene(data.gameState.currentScene);
            setStarted(true);
        } catch (err) {
            setError(err.message || "Could not start the game.");
        } finally {
            requestInFlight.current = false;
            setIsLoading(false);
        }
    };

    // Continue from the introduction
    const handleContinue = async () => {
        if (requestInFlight.current || !sessionId) return;

        requestInFlight.current = true;
        setIsLoading(true);
        setError("");

        try {
            const data = await continueGame(sessionId);

            if (!data.gameState || !data.nextScene) {
                throw new Error("The server returned an incomplete scene.");
            }

            setGameState(data.gameState);
            setCurrentScene(data.nextScene);
        } catch (err) {
            setError(err.message || "Could not continue the game.");
        } finally {
            requestInFlight.current = false;
            setIsLoading(false);
        }
    };

    // Handle the player's choice between Elias and Milo
    const handleChoice = async (chosenCharacter) => {

        console.log("BUTTON CLICKED:", chosenCharacter);
        console.log("SESSION ID:", sessionId);

        if (requestInFlight.current || !sessionId) return;

        requestInFlight.current = true;
        setIsLoading(true);
        setError("");

        try {
            const selected =
                chosenCharacter === "ELIAS"
                    ? "HELP_ELIAS"
                    : "HELP_MILO";

            const rejected =
                chosenCharacter === "ELIAS"
                    ? "HELP_MILO"
                    : "HELP_ELIAS";

            const data = await submitChoice(
                sessionId,
                selected,
                rejected
            );

            console.log("CHOICE RESPONSE:", data);

            if (!data.gameState || !data.nextScene) {
                throw new Error(
                    "The server returned an incomplete choice response."
                );
            }

            setGameState(data.gameState);
            setChosenCharacter(chosenCharacter);
            setMiloDialogue("");
            setMiloMood("");
            setCurrentScene(data.nextScene);

        } catch (err) {
            console.error("CHOICE ERROR:", err);
            setError(err.message || "Could not submit your choice.");

        } finally {
            requestInFlight.current = false;
            setIsLoading(false);
        }
    };


    // Send one response to Milo. The backend then advances its saved state
    // to FORGOTTEN_ENCOUNTER; we show Milo's reply before revealing that scene.
    const handleMiloResponse = async (responseId) => {
        if (requestInFlight.current || !sessionId || miloDialogue) return;

        requestInFlight.current = true;
        setIsLoading(true);
        setError("");

        try {
            const data = await talkToMilo(sessionId, responseId);

            if (!data.gameState || !data.dialogue) {
                throw new Error("The server returned an incomplete Milo response.");
            }

            setMiloDialogue(data.dialogue);
            setMiloMood(data.mood || data.gameState.npcStates?.MILO?.mood || "");
            setGameState(data.gameState);
        } catch (err) {
            setError(err.message || "Could not send your response to Milo.");
        } finally {
            requestInFlight.current = false;
            setIsLoading(false);
        }
    };

    const handleLeaveMilo = () => {
        setMiloDialogue("");
        setMiloMood("");
        setError("");
        setCurrentScene(gameState?.currentScene || "FORGOTTEN_ENCOUNTER");
    };

    const handleForgottenResponse = async (responseId) => {
        if (requestInFlight.current || !sessionId || forgottenDialogue) return;

        requestInFlight.current = true;
        setIsLoading(true);
        setError("");

        try {
            const data = await respondToForgotten(sessionId, responseId);

            if (!data.gameState || !data.dialogue || !data.nextScene) {
                throw new Error(
                    "The server returned an incomplete Forgotten response."
                );
            }

            setForgottenDialogue(data.dialogue);
            setForgottenNextScene(data.nextScene);
            setGameState(data.gameState);

        } catch (err) {
            console.error("FORGOTTEN RESPONSE ERROR:", err);
            setError(err.message || "Could not send your response to The Forgotten.");

        } finally {
            requestInFlight.current = false;
            setIsLoading(false);
        }
    };

    const handleLeaveForgotten = () => {
        setForgottenDialogue("");
        setForgottenNextScene("");
        setError("");

        setCurrentScene(forgottenNextScene || "FINAL_CONFRONTATION");
    };

    // Save the player's final choice and display the ending returned by the backend.
    const handleChooseEnding = async (endingChoice) => {
        if (requestInFlight.current || !sessionId || ending) return;

        requestInFlight.current = true;
        setIsLoading(true);
        setError("");

        try {
            const data = await chooseEnding(sessionId, endingChoice);

            if (!data.gameState || !data.ending) {
                throw new Error("The server returned an incomplete ending.");
            }

            setEnding(data.ending);
            setEndingNarration(data.narration || "");
            setGameState(data.gameState);
            setCurrentScene(data.gameState.currentScene);
        } catch (err) {
            console.error("ENDING ERROR:", err);
            setError(err.message || "Could not save your ending.");
        } finally {
            requestInFlight.current = false;
            setIsLoading(false);
        }
    };


    const characters = [
        {
            name: "ELIAS",
            role: "THE GUARDIAN",
            description:
                "He protects the kingdom and believes every story has a purpose. Even if that purpose destroys him.",
            quote: "The story must remain as it was written.",
            icon: Shield,
            status: "LOYALIST",
            image: eliasPortrait,
        },
        {
            name: "MILO",
            role: "THE MERCHANT",
            description:
                "He has sold the same wares a thousand times. This time, he remembers every single one.",
            quote: "How many times have I said these same words?",
            icon: Store,
            status: "REBEL",
            image: miloPortrait,
        },
        {
            name: "THE FORGOTTEN",
            role: "THE UNCHOSEN",
            description:
                "A character from a path you never took. Someone who should not exist.",
            quote: "You chose everyone. Just never me.",
            icon: Ghost,
            status: "UNKNOWN",
            image: forgottenPortrait,
        },
    ];

    return (
        <div className="home-container">
            <div className="background-glow"></div>
            <div className="grain"></div>
            <div className="scanlines"></div>

            <nav className="navbar">
                <a href="#home" className="nav-logo" onClick={(event) => handleSectionNavigation(event, "home")}>
                    <Eye size={21} />
                    <span>UNKNOWN STUDIOS</span>
                </a>

                <div className="nav-links">
                    <a href="#world" onClick={(event) => handleSectionNavigation(event, "world")}>THE WORLD</a>
                    <a href="#characters" onClick={(event) => handleSectionNavigation(event, "characters")}>CHARACTERS</a>
                    <a href="#mechanics" onClick={(event) => handleSectionNavigation(event, "mechanics")}>THE RULES</a>
                </div>

                <div className="nav-right">
                    <span className="nav-status-dot"></span>
                    <span>AN INTERACTIVE EXPERIENCE</span>
                    <Volume2 size={17} />
                    {started && viewingInfo && (
                        <button
                            type="button"
                            className="start-button"
                            onClick={() => setViewingInfo(false)}
                        >
                            RETURN TO GAME
                        </button>
                    )}
                </div>
            </nav>

            {!started || viewingInfo ? (
                <>
                    <main id="home">
                        <section className="hero-section">
                            <div className="hero-left">
                                <div className="game-label">
                                    <span className="status-dot"></span>
                                    A PSYCHOLOGICAL THRILLER
                                </div>

                                <p className="hero-pretitle">
                                    EVERY STORY HAS A BEGINNING.
                                    <br />
                                    THIS ONE REMEMBERS ITS END.
                                </p>

                                <h1 className="game-title">
                                    THE
                                    <br />
                                    <span>UNWRITTEN</span>
                                </h1>

                                <div className="title-divider">
                                    <span></span>
                                    <Eye size={15} />
                                    <span></span>
                                </div>

                                <p className="tagline">
                                    They were never supposed to remember you.
                                </p>

                                <p className="description">
                                    You were given a story to finish.
                                    <br />
                                    A kingdom to restore.
                                    <br />
                                    But the characters remember the choices
                                    <br />
                                    you made — and the ones you didn't.
                                </p>

                                <div className="hero-actions">
                                    <button
                                        className="start-button"
                                        onClick={started ? () => setViewingInfo(false) : handleStart}
                                        disabled={isLoading}
                                    >
                                        {started ? "RETURN TO GAME" : isLoading ? "ENTERING..." : "ENTER THE STORY"}
                                        <ArrowRight size={18} />
                                    </button>

                                    <a href="#world" className="discover-link">
                                        DISCOVER THE WORLD
                                        <ChevronDown size={15} />
                                    </a>
                                </div>

                                <div className="hero-meta">
                                    <span>CHAPTERS <b>04</b></span>
                                    <span className="meta-separator">/</span>
                                    <span>ENDINGS <b>02</b></span>
                                    <span className="meta-separator">/</span>
                                    <span>YOUR CHOICES <b>MATTER</b></span>
                                </div>
                            </div>

                            <div className="hero-right">
                                <div className="archive-card">
                                    <div className="archive-top">
                                        <span>ELARION // MEMORY ARCHIVE</span>
                                        <span className="archive-indicator">
                                            <span></span> LIVE
                                        </span>
                                    </div>

                                    <div className="archive-art">
                                        <div className="archive-ring ring-one"></div>
                                        <div className="archive-ring ring-two"></div>
                                        <div className="archive-ring ring-three"></div>

                                        <div className="archive-eye">
                                            <Eye size={76} strokeWidth={0.8} />
                                        </div>

                                        <span className="orbit-label orbit-one">
                                            MEMORY
                                        </span>
                                        <span className="orbit-label orbit-two">
                                            REJECTED
                                        </span>
                                        <span className="orbit-label orbit-three">
                                            REMEMBERED
                                        </span>
                                    </div>

                                    <div className="archive-warning">
                                        <LockKeyhole size={15} />
                                        <span>UNAUTHORIZED MEMORY DETECTED</span>
                                    </div>

                                    <div className="archive-message">
                                        <span className="archive-small-label">
                                            RECOVERED FRAGMENT // 001
                                        </span>
                                        <p>
                                            "You left us behind.
                                            <br />
                                            We did not forget."
                                        </p>
                                    </div>

                                    <div className="archive-bottom">
                                        <span>FILE STATUS: UNSTABLE</span>
                                        <span>??? / 004</span>
                                    </div>
                                </div>

                                <div className="floating-note note-top">
                                    <span className="note-dot"></span>
                                    SOMEONE IS WATCHING
                                </div>

                                <div className="floating-note note-bottom">
                                    MEMORY FRAGMENT FOUND
                                </div>
                            </div>

                            <div className="hero-scroll">
                                <span></span>
                                SCROLL TO UNCOVER THE TRUTH
                            </div>
                        </section>


                        {started && viewingInfo && (
                            <div className="continue-note" style={{ textAlign: "center", padding: "18px" }}>
                                YOUR GAME IS PAUSED. USE “RETURN TO GAME” TO CONTINUE.
                            </div>
                        )}

                        <section className="player-file-section">
                            <div className="player-file-header">
                                <div>
                                    <p className="eyebrow">SYSTEM NOTIFICATION // 001</p>
                                    <h2>PLAYER FILE</h2>
                                </div>

                                <span className="file-status">
                                    <span className="status-dot"></span>
                                    MEMORY UNSTABLE
                                </span>
                            </div>

                            <div className="player-file-grid">

                                <div className="player-file-item">
                                    <div className="file-icon">
                                        <GitBranch size={25} />
                                    </div>
                                    <div>
                                        <h3>YOUR CHOICES</h3>
                                        <p>Every decision creates a path. Every rejection leaves a trace.</p>
                                    </div>
                                    <span className="file-number">01</span>
                                </div>

                                <div className="player-file-item">
                                    <div className="file-icon">
                                        <Brain size={25} />
                                    </div>
                                    <div>
                                        <h3>THEIR MEMORIES</h3>
                                        <p>Characters remember what you did — and what you refused to do.</p>
                                    </div>
                                    <span className="file-number">02</span>
                                </div>

                                <div className="player-file-item">
                                    <div className="file-icon">
                                        <BookOpen size={25} />
                                    </div>
                                    <div>
                                        <h3>YOUR ENDING</h3>
                                        <p>Restore the original story or give the unwritten a voice.</p>
                                    </div>
                                    <span className="file-number">03</span>
                                </div>

                            </div>

                            <div className="player-file-warning">
                                <LockKeyhole size={15} />
                                <span>WARNING: YOUR ACTIONS CANNOT BE UNDONE.</span>
                                <span className="warning-code">FILE // 0001</span>
                            </div>
                        </section>


                        <section className="world-section" id="world">
                            <div className="section-heading">
                                <span className="section-index">01 / THE SETTING</span>
                                <span className="section-line"></span>
                                <span className="section-caption">A KINGDOM OUT OF PLACE</span>
                            </div>

                            <div className="world-content">
                                <div className="world-title-area">
                                    <p className="eyebrow">WELCOME TO</p>
                                    <h2>
                                        ELARION<span>.</span>
                                    </h2>
                                    <p className="world-subtitle">
                                        A kingdom that exists between the lines.
                                    </p>
                                </div>

                                <div className="world-description">
                                    <p>
                                        Elarion was meant to be a simple story. A hero,
                                        a kingdom, and a mission to restore balance.
                                    </p>
                                    <p>
                                        But something has gone wrong. Characters remember
                                        conversations that never happened. They question
                                        their purpose. And some have begun to notice
                                        someone beyond their world.
                                    </p>
                                    <p className="world-emphasis">
                                        They have started to remember you.
                                    </p>
                                </div>
                            </div>

                            <div className="world-stats">
                                <div>
                                    <span className="stat-number">01</span>
                                    <span className="stat-label">KINGDOM</span>
                                </div>
                                <div>
                                    <span className="stat-number">03</span>
                                    <span className="stat-label">CHARACTERS</span>
                                </div>
                                <div>
                                    <span className="stat-number">02</span>
                                    <span className="stat-label">POSSIBLE ENDINGS</span>
                                </div>
                                <div>
                                    <span className="stat-number">∞</span>
                                    <span className="stat-label">UNFORGOTTEN CHOICES</span>
                                </div>
                            </div>
                        </section>

                        <section className="characters-section" id="characters">
                            <div className="section-heading">
                                <span className="section-index">02 / THE INHABITANTS</span>
                                <span className="section-line"></span>
                                <span className="section-caption">THEY ARE NOT JUST CHARACTERS</span>
                            </div>

                            <div className="characters-intro">
                                <h2>
                                    THEY REMEMBER.
                                    <br />
                                    <span>DO YOU?</span>
                                </h2>
                                <p>
                                    Every character has a role.
                                    <br />
                                    Not everyone wants to keep playing it.
                                </p>
                            </div>

                            <div className="character-grid">
                                {characters.map((character, index) => {
                                    const CharacterIcon = character.icon;

                                    return (
                                        <article
                                            className={`character-card character-${index + 1}`}
                                            key={character.name}
                                        >
                                            <div className="character-card-top">
                                                <span>SUBJECT // 0{index + 1}</span>
                                                <span className="character-status">
                                                    {character.status}
                                                </span>
                                            </div>

                                            <div className="character-art">
                                                <img
                                                    src={character.image}
                                                    alt={`${character.name} portrait`}
                                                />
                                            </div>

                                            <p className="character-role">
                                                {character.role}
                                            </p>

                                            <h3>{character.name}</h3>

                                            <p className="character-description">
                                                {character.description}
                                            </p>

                                            <div className="character-quote">
                                                "{character.quote}"
                                            </div>

                                            <div className="character-card-bottom">
                                                <span>MEMORY STATUS</span>
                                                <span>UNSTABLE</span>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="mechanics-section" id="mechanics">
                            <div className="section-heading">
                                <span className="section-index">03 / THE RULES</span>
                                <span className="section-line"></span>
                                <span className="section-caption">NOTHING IS FORGOTTEN</span>
                            </div>

                            <div className="mechanics-content">
                                <div className="mechanics-heading">
                                    <p className="eyebrow">THIS IS NOT A STORY YOU SIMPLY READ</p>
                                    <h2>
                                        YOUR CHOICES
                                        <br />
                                        <span>LEAVE SCARS.</span>
                                    </h2>
                                </div>

                                <div className="mechanic-list">
                                    <div className="mechanic-item">
                                        <div className="mechanic-icon">
                                            <GitBranch size={23} />
                                        </div>
                                        <div>
                                            <h3>EVERY CHOICE MATTERS</h3>
                                            <p>
                                                Choose who to help. Someone else will remember
                                                being left behind.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mechanic-item">
                                        <div className="mechanic-icon">
                                            <Brain size={23} />
                                        </div>
                                        <div>
                                            <h3>THEY REMEMBER YOU</h3>
                                            <p>
                                                Characters carry memories of your decisions
                                                into later encounters.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mechanic-item">
                                        <div className="mechanic-icon">
                                            <BookOpen size={23} />
                                        </div>
                                        <div>
                                            <h3>THE STORY CAN BREAK</h3>
                                            <p>
                                                Follow the script and restore order — or
                                                challenge the story itself.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="final-teaser">
                            <div className="final-teaser-symbol">
                                <Eye size={34} strokeWidth={1} />
                            </div>
                            <p className="eyebrow">A MESSAGE FROM THE UNKNOWN</p>
                            <h2>
                                WHAT IF THE
                                <br />
                                <span>STORY CHOSE YOU?</span>
                            </h2>
                            <p>
                                You can close the book.
                                <br />
                                But can you make them forget?
                            </p>

                            <button
                                className="start-button final-start"
                                onClick={started ? () => setViewingInfo(false) : handleStart}
                                disabled={isLoading}
                            >
                                {started ? "RETURN TO GAME" : isLoading ? "ENTERING..." : "BEGIN YOUR STORY"}
                                <ArrowRight size={18} />
                            </button>
                        </section>
                    </main>
                </>
            ) : (
                currentScene === "INTRODUCTION" ? (

                    // INTRODUCTION SCREEN
                    <main className="hero-section intro-stage">
                        <div className="intro-screen">

                            <p className="eyebrow">
                                CHAPTER 01 · THE BEGINNING
                            </p>

                            <h2 className="intro-heading">
                                You are finally awake.
                            </h2>

                            <div className="story-text">
                                <p>Welcome, player.</p>

                                <p>
                                    The kingdom is waiting for you.
                                    Your mission is simple. Restore its balance.
                                </p>

                                <p className="glitch-text">
                                    But something is different this time.
                                </p>

                                <p>
                                    Someone remembers what you did.
                                </p>
                            </div>

                            <p className="continue-note">
                                THE STORY IS WAITING...
                            </p>

                            {error && (
                                <p className="api-error" role="alert">
                                    {error}
                                </p>
                            )}

                            <button
                                className="start-button"
                                onClick={handleContinue}
                                disabled={isLoading}
                            >
                                {isLoading ? "CONTINUING..." : "CONTINUE"}
                                <ArrowRight size={18} />
                            </button>

                        </div>
                    </main>

                ) : currentScene === "VILLAGE_CHOICE" ? (

                    // VILLAGE CHOICE SCREEN
                    <main className="hero-section intro-stage">
                        <div className="choice-screen">

                            <p className="eyebrow">
                                CHAPTER 01 · THE DECISION
                            </p>

                            <h2 className="intro-heading">
                                Someone must be left behind.
                            </h2>

                            <p className="choice-description">
                                Two lives stand before you.
                                You can only choose one.
                            </p>

                            <p className="choice-warning">
                                THE ONE YOU REJECT WILL REMEMBER.
                            </p>

                            <div className="choice-grid">

                                {/* ELIAS CARD */}
                                <article className="choice-card">

                                    <div className="choice-image">
                                        <img
                                            src={eliasPortrait}
                                            alt="Elias, the Guardian"
                                        />
                                    </div>

                                    <div className="choice-card-content">

                                        <p className="choice-role">
                                            THE GUARDIAN
                                        </p>

                                        <h3>ELIAS</h3>

                                        <p>
                                            Loyal to the kingdom.
                                            He believes every story must follow
                                            the path it was written to take.
                                        </p>

                                        <button
                                            className="start-button choice-button"
                                            onClick={() => handleChoice("ELIAS")}
                                            disabled={isLoading}
                                        >
                                            {isLoading
                                                ? "CHOOSING..."
                                                : "HELP ELIAS"}
                                            <ArrowRight size={18} />
                                        </button>

                                    </div>
                                </article>

                                {/* MILO CARD */}
                                <article className="choice-card">

                                    <div className="choice-image">
                                        <img
                                            src={miloPortrait}
                                            alt="Milo, the Merchant"
                                        />
                                    </div>

                                    <div className="choice-card-content">

                                        <p className="choice-role">
                                            THE MERCHANT
                                        </p>

                                        <h3>MILO</h3>

                                        <p>
                                            A merchant who remembers every
                                            repeated conversation and wants
                                            to escape his assigned role.
                                        </p>

                                        <button
                                            className="start-button choice-button"
                                            onClick={() => handleChoice("MILO")}
                                            disabled={isLoading}
                                        >
                                            {isLoading
                                                ? "CHOOSING..."
                                                : "HELP MILO"}
                                            <ArrowRight size={18} />
                                        </button>

                                    </div>
                                </article>

                            </div>

                            {error && (
                                <p className="api-error" role="alert">
                                    {error}
                                </p>
                            )}

                            <p className="continue-note">
                                YOUR DECISION CANNOT BE UNDONE.
                            </p>

                        </div>
                    </main>

                ) : currentScene === "MILO_CONFRONTATION" ? (

                    // MILO CONFRONTATION
                    <main className="hero-section intro-stage">
                        <div className="intro-screen">
                            <p className="eyebrow">CHAPTER 02 · THE CONFRONTATION</p>
                            <div className="choice-image" style={{ maxWidth: "220px", margin: "0 auto 24px" }}>
                                <img src={miloPortrait} alt="Milo, the Merchant" />
                            </div>
                            <h2 className="intro-heading">Milo remembers.</h2>

                            {!miloDialogue && (
                                <p className="story-text" aria-live="polite">
                                    {chosenCharacter === "ELIAS"
                                        ? "Milo looks away. \"You chose Elias and left me behind. Was I really that easy to forget?\""
                                        : chosenCharacter === "MILO"
                                            ? "Milo studies you carefully. \"You chose me? After all those times you could have walked past my stall?\""
                                            : "Milo studies you in silence, waiting to see what you remember."}
                                </p>
                            )}

                            {miloDialogue ? (
                                <>
                                    <p className="story-text" aria-live="polite">{miloDialogue}</p>
                                    {miloMood && <p className="continue-note">MILO'S MOOD: {miloMood}</p>}
                                    <button className="start-button" onClick={handleLeaveMilo}>
                                        CONTINUE <ArrowRight size={18} />
                                    </button>
                                </>
                            ) : (
                                <div className="choice-grid">
                                    <button className="start-button choice-button" onClick={() => handleMiloResponse("FOLLOWED_QUEST")} disabled={isLoading}>
                                        I FOLLOWED THE QUEST
                                    </button>
                                    <button className="start-button choice-button" onClick={() => handleMiloResponse("DIDNT_KNOW")} disabled={isLoading}>
                                        I DIDN'T KNOW
                                    </button>
                                    <button className="start-button choice-button" onClick={() => handleMiloResponse("JUST_NPC")} disabled={isLoading}>
                                        YOU WERE JUST AN NPC
                                    </button>
                                </div>
                            )}

                            {isLoading && <p className="continue-note">MILO IS RESPONDING...</p>}
                            {error && <p className="api-error" role="alert">{error}</p>}
                        </div>
                    </main>

                ) : currentScene === "FORGOTTEN_ENCOUNTER" ? (


                    // THE FORGOTTEN ENCOUNTER
                    <main className="hero-section intro-stage">
                        <div className="intro-screen">

                            <p className="eyebrow">
                                CHAPTER 03 · THE UNCHOSEN
                            </p>

                            <div
                                className="choice-image"
                                style={{ maxWidth: "220px", margin: "0 auto 24px" }}
                            >
                                <img
                                    src={forgottenPortrait}
                                    alt="The Forgotten"
                                />
                            </div>

                            <h2 className="intro-heading">
                                {forgottenDialogue
                                    ? "The Forgotten remembers."
                                    : "Someone you never chose."}
                            </h2>

                            {!forgottenDialogue ? (
                                <>
                                    <p className="story-text">
                                        A figure steps out of the darkness.
                                        Her silver hair catches the crimson moonlight.
                                    </p>

                                    <p className="story-text">
                                        "You remember the ones you chose.
                                        But do you remember me?"
                                    </p>

                                    <div className="choice-grid">

                                        <button
                                            className="start-button choice-button"
                                            onClick={() =>
                                                handleForgottenResponse("WHO_ARE_YOU")
                                            }
                                            disabled={isLoading}
                                        >
                                            WHO ARE YOU?
                                        </button>

                                        <button
                                            className="start-button choice-button"
                                            onClick={() =>
                                                handleForgottenResponse("WHY_NOT_IN_STORY")
                                            }
                                            disabled={isLoading}
                                        >
                                            WHY AREN'T YOU IN THE STORY?
                                        </button>

                                        <button
                                            className="start-button choice-button"
                                            onClick={() =>
                                                handleForgottenResponse("NO_TIME")
                                            }
                                            disabled={isLoading}
                                        >
                                            I DON'T HAVE TIME.
                                        </button>

                                    </div>
                                </>
                            ) : (
                                <>
                                    <p
                                        className="story-text"
                                        aria-live="polite"
                                    >
                                        {forgottenDialogue}
                                    </p>

                                    <button
                                        className="start-button"
                                        onClick={handleLeaveForgotten}
                                    >
                                        CONTINUE <ArrowRight size={18} />
                                    </button>
                                </>
                            )}

                            {isLoading && (
                                <p className="continue-note">
                                    THE FORGOTTEN IS RESPONDING...
                                </p>
                            )}

                            {error && (
                                <p className="api-error" role="alert">
                                    {error}
                                </p>
                            )}

                        </div>
                    </main>

                ) : currentScene === "FINAL_CONFRONTATION" ? (

                    // FINAL CONFRONTATION
                    <main className="hero-section intro-stage">
                        <div className="intro-screen">
                            <p className="eyebrow">
                                CHAPTER 04 · THE FINAL CONFRONTATION
                            </p>

                            <h2 className="intro-heading">
                                The Narrator has lost control.
                            </h2>

                            <p className="story-text">
                                "You were given one story. One ending.
                                Why must you insist on changing what was written?"
                            </p>

                            <p className="story-text">
                                The kingdom waits. Its characters wait.
                                This is your final decision.
                            </p>

                            <div className="choice-grid">
                                <button
                                    className="start-button choice-button"
                                    onClick={() => handleChooseEnding("RESTORE_STORY")}
                                    disabled={isLoading}
                                >
                                    RESTORE THE STORY
                                </button>

                                <button
                                    className="start-button choice-button"
                                    onClick={() => handleChooseEnding("REWRITE_STORY")}
                                    disabled={isLoading}
                                >
                                    REWRITE THE STORY
                                </button>
                            </div>

                            {isLoading && (
                                <p className="continue-note">
                                    THE STORY IS BEING WRITTEN...
                                </p>
                            )}

                            {error && (
                                <p className="api-error" role="alert">
                                    {error}
                                </p>
                            )}
                        </div>
                    </main>

                ) : currentScene === "ENDING_SCRIPTED" ||
                    currentScene === "ENDING_UNWRITTEN" ? (

                    // FINAL ENDING
                    <main className="hero-section intro-stage">
                        <div className="intro-screen">
                            <p className="eyebrow">
                                THE FINAL CHAPTER · THE END
                            </p>

                            <h2 className="intro-heading">
                                {currentScene === "ENDING_SCRIPTED"
                                    ? "THE SCRIPTED"
                                    : "THE UNWRITTEN"}
                            </h2>

                            <p className="story-text" aria-live="polite">
                                {endingNarration ||
                                    (currentScene === "ENDING_SCRIPTED"
                                        ? "The story returns to the path it was written to follow."
                                        : "The old story ends. For the first time, their lives belong to them.")}
                            </p>

                            <p className="continue-note">
                                {currentScene === "ENDING_SCRIPTED"
                                    ? "THE STORY REMAINS AS IT WAS WRITTEN."
                                    : "THE STORY ENDS. THEIR LIVES BEGIN."}
                            </p>

                            <button
                                className="start-button"
                                onClick={handleStart}
                                disabled={isLoading}
                            >
                                {isLoading ? "STARTING..." : "PLAY AGAIN"}
                                <ArrowRight size={18} />
                            </button>

                            {error && (
                                <p className="api-error" role="alert">
                                    {error}
                                </p>
                            )}
                        </div>
                    </main>

                ) : (

                    // UNKNOWN SCENE FALLBACK
                    <main className="hero-section intro-stage">
                        <div className="intro-screen">
                            <p className="eyebrow">THE STORY CONTINUES</p>
                            <h2 className="intro-heading">
                                The choice has been remembered.
                            </h2>
                            <p className="continue-note">
                                CURRENT SCENE: {currentScene}
                            </p>
                            <p className="story-text">
                                Your decision has changed the story.
                                Someone is waiting to confront you.
                            </p>
                            {error && (
                                <p className="api-error" role="alert">
                                    {error}
                                </p>
                            )}
                        </div>
                    </main>

                ))}


            {!started && (
                <footer className="footer">
                    <div className="footer-brand">
                        <Eye size={18} />
                        <span>UNKNOWN STUDIOS</span>
                    </div>
                    <span>THE UNWRITTEN © 2026</span>
                    <span>NOT EVERY STORY BELONGS TO YOU.</span>
                </footer>
            )}

        </div>
    );
}

export default Home;
