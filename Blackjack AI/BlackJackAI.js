const deck = [];
const suits = {
  '♠': { symbol: '♠', name: 'spades' },
  '♥': { symbol: '♥', name: 'hearts' },
  '♦': { symbol: '♦', name: 'diamonds' },
  '♣': { symbol: '♣', name: 'clubs' }
};
const values = [
  'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'
];

let playerHand = [], dealerHand = [];
let gameOver = false;
let gameHistory = [];

const dealerCards = document.getElementById('dealer-cards');
const playerCards = document.getElementById('player-cards');
const dealerScoreDisplay = document.getElementById('dealer-score');
const playerScoreDisplay = document.getElementById('player-score');
const resultText = document.getElementById('result');
const aiComment = document.getElementById('ai-comment');
const historyList = document.getElementById('history-list');

const dealBtn = document.getElementById('deal-button');
const hitBtn = document.getElementById('hit-button');
const standBtn = document.getElementById('stand-button');

dealBtn.addEventListener('click', startGame);
hitBtn.addEventListener('click', () => playerTurn('hit'));
standBtn.addEventListener('click', () => playerTurn('stand'));

function createDeck() {
  deck.length = 0;
  for (let suitSymbol in suits) {
    for (let value of values) {
      deck.push({ suit: suitSymbol, value });
    }
  }
  shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function calculateScore(hand) {
  let score = 0;
  let aces = 0;
  
  for (const card of hand) {
    const value = card.value;
    if (['K', 'Q', 'J'].includes(value)) {
      score += 10;
    } else if (value === 'A') {
      score += 11;
      aces += 1;
    } else {
      score += parseInt(value);
    }
  }

  while (score > 21 && aces) {
    score -= 10;
    aces -= 1;
  }

  return score;
}

function dealHand(count = 2) {
  return Array.from({ length: count }, () => deck.pop());
}

function startGame() {
  if (gameOver && playerHand.length > 0) {
    const result = resultText.textContent;
    addToHistory(playerHand, dealerHand, result);
  }
  
  gameOver = false;
  createDeck();
  
  playerHand = dealHand();
  dealerHand = dealHand();

  updateDisplay();
  resultText.textContent = '';
  aiComment.textContent = getDealerComment('start');

  hitBtn.disabled = false;
  standBtn.disabled = false;
}

function updateDisplay() {
  displayCards(playerCards, playerHand);
  displayCards(dealerCards, dealerHand, gameOver);
  playerScoreDisplay.textContent = 'Score: ' + calculateScore(playerHand);
  dealerScoreDisplay.textContent = gameOver
    ? 'Score: ' + calculateScore(dealerHand)
    : 'Score: ??';
}

function displayCards(container, hand, revealAll = true) {
  container.innerHTML = '';
  hand.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    
    if (index === 1 && !revealAll) {
      cardElement.className = 'card face-down';
    } else {
      // Add red color class for hearts and diamonds
      if (card.suit === '♥' || card.suit === '♦') {
        cardElement.className += ' red';
      }

      // Create corner values
      const topCorner = document.createElement('div');
      topCorner.className = 'corner-value top-left';
      topCorner.textContent = card.value;

      const bottomCorner = document.createElement('div');
      bottomCorner.className = 'corner-value bottom-right';
      bottomCorner.textContent = card.value;

      // Create center value and suit
      const centerValue = document.createElement('div');
      centerValue.className = 'value';
      centerValue.textContent = card.value;

      const centerSuit = document.createElement('div');
      centerSuit.className = 'suit';
      centerSuit.textContent = card.suit;

      // Add all elements to the card
      cardElement.appendChild(topCorner);
      cardElement.appendChild(centerValue);
      cardElement.appendChild(centerSuit);
      cardElement.appendChild(bottomCorner);
    }

    container.appendChild(cardElement);
  });
}

function playerTurn(action) {
  if (gameOver) return;

  if (action === 'hit') {
    playerHand.push(deck.pop());
    updateDisplay();
    aiComment.textContent = getDealerComment('hit');
    
    if (calculateScore(playerHand) > 21) {
      endGame(false);
    }
  } else if (action === 'stand') {
    aiComment.textContent = getDealerComment('stand');
    dealerPlay();
    endGame(true);
  }
}

function dealerPlay() {
  while (calculateScore(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }
  updateDisplay();
}

function determineWinner(playerScore, dealerScore) {
  if (playerScore > 21) {
    return 'Dealer wins (Player busted)';
  } else if (dealerScore > 21) {
    return 'Player wins (Dealer busted)';
  } else if (playerScore > dealerScore) {
    return 'Player wins';
  } else if (dealerScore > playerScore) {
    return 'Dealer wins';
  } else {
    return 'Push (Tie)';
  }
}

function endGame(playerWon) {
  gameOver = true;
  updateDisplay();
  
  const playerScore = calculateScore(playerHand);
  const dealerScore = calculateScore(dealerHand);
  const result = determineWinner(playerScore, dealerScore);
  
  resultText.textContent = result;
  aiComment.textContent = getDealerComment('end', result);

  let earnings = 0;
  
  if (playerWon) {
    resultText.textContent = "You win!";
    earnings = 10; // Basic winning amount
  } else {
    resultText.textContent = "Dealer wins!";
    earnings = -5; // Basic losing amount
  }
  
  // Update player statistics
  if (window.casinoAccount) {
    window.casinoAccount.updateStats('blackjack', playerWon, earnings);
  }
  
  // Update game history
  addToHistory(playerHand, dealerHand, result);
  
  // Enable/disable buttons
  hitBtn.disabled = true;
  standBtn.disabled = true;
  dealBtn.disabled = false;
}

function getDealerComment(stage, result = '') {
  const comments = {
    start: [
      "Oh, you're back? Ready to lose again?",
      "Let's see how fast this goes south.",
      "Dealing cards... not hope."
    ],
    hit: [
      "Another card? Feeling lucky, punk?",
      "Living on the edge, huh?",
      "Bold choice. Let's see how badly it goes."
    ],
    stand: [
      "Standing? I thought you were braver than that.",
      "Let the real game begin.",
      "Oh? Playing it safe? Boooring."
    ],
    end: [
      "Wow. Didn't expect that... still disappointed.",
      "Game over. You win nothing. Good day, sir.",
      "Was that your best? Yikes."
    ]
  };

  if (stage === 'end') {
    if (result.includes('Player wins')) {
      return "You won? Is this a prank?";
    } else if (result.includes('Dealer wins')) {
      return "As expected. Dealer reigns.";
    } else if (result.includes('Push')) {
      return "A tie? That's just lazy.";
    }
  }

  const lines = comments[stage];
  return lines[Math.floor(Math.random() * lines.length)];
}

function addToHistory(playerHand, dealerHand, result) {
  const gameData = {
    id: gameHistory.length + 1,
    timestamp: new Date(),
    playerHand: [...playerHand],
    dealerHand: [...dealerHand],
    result: result,
    playerScore: calculateScore(playerHand),
    dealerScore: calculateScore(dealerHand)
  };

  gameHistory.unshift(gameData);
  if (gameHistory.length > 10) {
    gameHistory.pop();
  }

  updateHistoryDisplay();
  
  localStorage.setItem('blackjackHistory', JSON.stringify(gameHistory));
}

function updateHistoryDisplay() {
  historyList.innerHTML = '';
  
  gameHistory.forEach(game => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const gameNumber = document.createElement('div');
    gameNumber.className = 'game-number';
    gameNumber.textContent = `Game #${game.id}`;
    
    const hands = document.createElement('div');
    hands.className = 'hands';
    
    const dealerSection = document.createElement('div');
    dealerSection.innerHTML = `<strong>Dealer (${game.dealerScore}):</strong>`;
    const dealerCards = document.createElement('div');
    dealerCards.className = 'mini-cards';
    game.dealerHand.forEach(card => {
      const miniCard = document.createElement('span');
      miniCard.className = 'mini-card' + (card.suit === '♥' || card.suit === '♦' ? ' red' : '');
      miniCard.textContent = `${card.value}${card.suit}`;
      dealerCards.appendChild(miniCard);
    });
    dealerSection.appendChild(dealerCards);
    
    const playerSection = document.createElement('div');
    playerSection.innerHTML = `<strong>Player (${game.playerScore}):</strong>`;
    const playerCards = document.createElement('div');
    playerCards.className = 'mini-cards';
    game.playerHand.forEach(card => {
      const miniCard = document.createElement('span');
      miniCard.className = 'mini-card' + (card.suit === '♥' || card.suit === '♦' ? ' red' : '');
      miniCard.textContent = `${card.value}${card.suit}`;
      playerCards.appendChild(miniCard);
    });
    playerSection.appendChild(playerCards);
    
    const result = document.createElement('div');
    result.className = 'result';
    result.textContent = game.result;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date(game.timestamp).toLocaleString();
    
    hands.appendChild(dealerSection);
    hands.appendChild(playerSection);
    
    historyItem.appendChild(gameNumber);
    historyItem.appendChild(hands);
    historyItem.appendChild(result);
    historyItem.appendChild(timestamp);
    
    historyList.appendChild(historyItem);
  });
}

window.addEventListener('load', () => {
  const savedHistory = localStorage.getItem('blackjackHistory');
  if (savedHistory) {
    gameHistory = JSON.parse(savedHistory);
    updateHistoryDisplay();
  }
});
