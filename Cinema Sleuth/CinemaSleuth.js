import React, { useState, useEffect, useRef } from 'react';

// Main App component for the Cinematic Sleuth game
function App() {
  // Game states
  const [secretMovie, setSecretMovie] = useState(null); // The movie the AI is "thinking" of
  const [questionsAsked, setQuestionsAsked] = useState([]); // List of questions and AI's answers
  const [currentInput, setCurrentInput] = useState(''); // Current text in the input field
  const [questionsLeft, setQuestionsLeft] = useState(21); // Number of questions remaining
  const [gamePhase, setGamePhase] = useState('start'); // 'start', 'playing', 'guessing', 'win', 'lose'
  const [message, setMessage] = useState(''); // General messages to the user
  const [isLoading, setIsLoading] = useState(false); // To show loading state for AI response
  const [showModal, setShowModal] = useState(false); // To control modal visibility
  const [modalContent, setModalContent] = useState({}); // Content for the modal

  // Scroll to bottom of chat
  const chatEndRef = useRef(null);

  // Example movie data (can be expanded or fetched from an external source)
  // For the AI to answer, its "knowledge" about the movie comes from these attributes.
  const movies = [
    {
      id: 1,
      title: "The Matrix",
      genre: ["Sci-Fi", "Action"],
      leadActors: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
      setting: "Urban, Dystopian, Virtual Reality",
      plotKeywords: ["computers", "simulation", "red pill", "chosen one", "agents", "bullet time"],
      year: 1999,
      rating: "R",
      ending: "Hopeful, but open-ended",
    },
    {
      id: 2,
      title: "Toy Story",
      genre: ["Animation", "Family", "Comedy"],
      leadActors: ["Tom Hanks", "Tim Allen"],
      setting: "Child's Room, Suburban Home",
      plotKeywords: ["toys come to life", "rivalry", "friendship", "adventure", "buzz lightyear", "woody"],
      year: 1995,
      rating: "G",
      ending: "Happy",
    },
    {
      id: 3,
      title: "Jurassic Park",
      genre: ["Sci-Fi", "Adventure"],
      leadActors: ["Sam Neill", "Laura Dern", "Jeff Goldblum"],
      setting: "Dinosaur Island, Theme Park",
      plotKeywords: ["dinosaurs", "cloning", "theme park gone wrong", "survival", "amber"],
      year: 1993,
      rating: "PG-13",
      ending: "Escaped, partially happy",
    },
    {
      id: 4,
      title: "Forrest Gump",
      genre: ["Drama", "Romance", "Comedy"],
      leadActors: ["Tom Hanks", "Robin Wright", "Gary Sinise"],
      setting: "Various US locations, 20th Century",
      plotKeywords: ["historical events", "running", "shrimp boat", "life is like a box of chocolates"],
      year: 1994,
      rating: "PG-13",
      ending: "Bittersweet, hopeful",
    },
    {
      id: 5,
      title: "Inception",
      genre: ["Sci-Fi", "Action", "Thriller"],
      leadActors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
      setting: "Dreams, Urban",
      plotKeywords: ["dreams within dreams", "heist", "subconscious", "totem", "spinning top"],
      year: 2010,
      rating: "PG-13",
      ending: "Ambiguous",
    },
  ];

  // Effect to scroll to the bottom of the chat area when new content is added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [questionsAsked]);

  /**
   * Initializes a new game.
   * Selects a random movie, resets questions, and sets the game phase.
   */
  const startGame = () => {
    const randomIndex = Math.floor(Math.random() * movies.length);
    setSecretMovie(movies[randomIndex]);
    setQuestionsAsked([]);
    setQuestionsLeft(21);
    setGamePhase('playing');
    setMessage('I\'m thinking of a movie! Ask me a yes/no question.');
    setShowModal(false);
  };

  /**
   * Handles user input for questions or guesses.
   */
  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };

  /**
   * Submits a question to the AI.
   */
  const askQuestion = async () => {
    if (!currentInput.trim()) {
      setMessage('Please type a question.');
      return;
    }
    if (questionsLeft === 0) {
      setMessage('No questions left! You must guess now.');
      return;
    }

    setIsLoading(true);
    setMessage('AI is thinking...');

    try {
      // Construct a detailed prompt for the AI to answer the question based on the secret movie's attributes.
      // This helps the AI provide accurate yes/no answers.
      const prompt = `I am thinking of the movie "${secretMovie.title}". It is a ${secretMovie.genre.join(', ')} film, starring ${secretMovie.leadActors.join(', ')}. It is set in a ${secretMovie.setting} environment and released in ${secretMovie.year}. Its plot involves themes like: ${secretMovie.plotKeywords.join(', ')}. The movie is rated ${secretMovie.rating}.

      Given this information, if the user asks "${currentInput}", should the answer be 'yes' or 'no'?
      Please respond with ONLY 'Yes' or 'No'. Do not add any other text or punctuation.`;

      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };
      const apiKey = ""; // Canvas will automatically provide this in runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      let aiAnswer = "I'm not sure how to answer that.";

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        // Normalize the AI's response to ensure it's 'Yes' or 'No'
        aiAnswer = text.trim().toLowerCase() === 'yes' ? 'Yes' : (text.trim().toLowerCase() === 'no' ? 'No' : "Hmm, I can't quite answer that with a simple yes or no.");
      } else {
        console.error("Unexpected API response structure:", result);
        aiAnswer = "I had trouble processing that question. Please try again.";
      }

      setQuestionsAsked(prev => [...prev, { question: currentInput, answer: aiAnswer }]);
      setQuestionsLeft(prev => prev - 1);
      setCurrentInput('');
      setMessage(''); // Clear any previous loading or instruction messages
      setGamePhase(questionsLeft - 1 === 0 ? 'guessing' : 'playing'); // If no questions left, force guessing phase
    } catch (error) {
      console.error("Error asking question:", error);
      setMessage("An error occurred while getting the AI's response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submits the player's movie guess.
   */
  const makeGuess = () => {
    if (!currentInput.trim()) {
      setMessage('Please type your guess.');
      return;
    }

    // Basic string comparison for the guess.
    // Could be improved with fuzzy matching or AI-assisted checking.
    const normalizedGuess = currentInput.trim().toLowerCase();
    const normalizedSecretTitle = secretMovie.title.toLowerCase();

    setQuestionsAsked(prev => [...prev, { question: `My guess is: ${currentInput}`, answer: '' }]); // Add guess to history

    if (normalizedGuess === normalizedSecretTitle ||
        normalizedGuess.includes(normalizedSecretTitle.split(' ')[0]) && normalizedGuess.includes(normalizedSecretTitle.split(' ').slice(-1)[0]) // Simple check for first and last word
    ) {
      setGamePhase('win');
      setModalContent({
        title: "You Guessed It!",
        message: `Congratulations! The movie was indeed "${secretMovie.title}"! You solved it in ${21 - questionsLeft} questions.`,
        buttonText: "Play Again",
        onButtonClick: startGame,
      });
      setShowModal(true);
    } else {
      if (questionsLeft === 0) {
        setGamePhase('lose');
        setModalContent({
          title: "Out of Questions!",
          message: `Oops! You ran out of questions and didn't guess correctly. The movie was "${secretMovie.title}". Better luck next time!`,
          buttonText: "Play Again",
          onButtonClick: startGame,
        });
        setShowModal(true);
      } else {
        setMessage("That's not it! Try another question or guess again.");
      }
    }
    setCurrentInput('');
  };

  /**
   * Renders the modal for game results or instructions.
   */
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold text-teal-400 mb-4">{modalContent.title}</h2>
          <p className="text-gray-200 mb-6">{modalContent.message}</p>
          <button
            onClick={modalContent.onButtonClick}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75"
          >
            {modalContent.buttonText}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-10 px-4 bg-gradient-to-br from-gray-900 to-gray-800">
      {renderModal()}

      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-2xl border border-gray-700">
        <h1 className="text-4xl font-extrabold text-center mb-6 text-teal-400">Cinematic Sleuth</h1>

        {gamePhase === 'start' && (
          <div className="text-center">
            <p className="text-gray-300 mb-6 text-lg">
              Welcome to Cinematic Sleuth! I'll think of a movie, and you have 21 yes/no questions to guess it.
              Try to deduce the movie with clever questions!
            </p>
            <button
              onClick={() => startGame()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-75 text-xl"
            >
              Start New Game
            </button>
          </div>
        )}

        {gamePhase !== 'start' && (
          <>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
              <p className="text-lg text-gray-300">Questions Left: <span className="font-bold text-teal-400">{questionsLeft}</span></p>
              <button
                onClick={() => {
                  setModalContent({
                    title: "Game Rules",
                    message: "I'm thinking of a movie. Ask me yes/no questions to figure it out! You have 21 questions total. When you're ready, make your guess. Good luck!",
                    buttonText: "Got It!",
                    onButtonClick: () => setShowModal(false),
                  });
                  setShowModal(true);
                }}
                className="text-gray-400 hover:text-teal-400 text-sm focus:outline-none"
              >
                How to Play?
              </button>
            </div>

            {/* Chat Area */}
            <div className="bg-gray-900 p-4 rounded-lg h-80 overflow-y-auto mb-4 border border-gray-700">
              {questionsAsked.length === 0 && (
                <p className="text-gray-500 text-center italic mt-10">{message || 'Ask your first question!'}</p>
              )}
              {questionsAsked.map((qa, index) => (
                <div key={index} className="mb-3">
                  <div className="flex items-start">
                    <span className="font-semibold text-blue-400 flex-shrink-0 w-16 md:w-20">You:</span>
                    <p className="text-gray-200 break-words flex-grow">{qa.question}</p>
                  </div>
                  {qa.answer && (
                    <div className="flex items-start mt-1">
                      <span className="font-semibold text-teal-400 flex-shrink-0 w-16 md:w-20">AI:</span>
                      <p className="text-gray-300 break-words flex-grow">{qa.answer}</p>
                    </div>
                  )}
                  {qa.answer === '' && qa.question.startsWith('My guess is:') && (
                     <div className="flex items-start mt-1">
                     <span className="font-semibold text-teal-400 flex-shrink-0 w-16 md:w-20">AI:</span>
                     <p className="text-gray-300 break-words flex-grow">Let me check...</p>
                   </div>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start mt-3">
                   <span className="font-semibold text-teal-400 flex-shrink-0 w-16 md:w-20">AI:</span>
                   <p className="text-gray-500 italic">Thinking...</p>
                 </div>
              )}
              <div ref={chatEndRef} /> {/* For auto-scrolling */}
            </div>

            {/* Input and Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={currentInput}
                onChange={handleInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    if (gamePhase === 'playing') askQuestion();
                    else makeGuess(); // If in 'guessing' phase or questions are 0
                  }
                }}
                placeholder={questionsLeft > 0 ? "Ask a yes/no question..." : "Time to guess the movie!"}
                className="flex-grow p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                disabled={isLoading}
              />
              <div className="flex gap-3">
                <button
                  onClick={askQuestion}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || questionsLeft === 0}
                >
                  {isLoading ? 'Asking...' : 'Ask Question'}
                </button>
                <button
                  onClick={makeGuess}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  Guess Movie
                </button>
              </div>
            </div>
            {message && <p className="text-red-400 mt-2 text-center">{message}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
