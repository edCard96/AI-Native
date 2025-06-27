const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let deck = [];
let playerHand = [];
let bankerHand = [];
let currentBet = 50;
let selectedBet = null;
let playerChips = 1000;

// DOM Elements
const playerCardsEl = document.getElementById('player-cards');
const bankerCardsEl = document.getElementById('banker-cards');
const playerScoreEl = document.getElementById('player-score');
const bankerScoreEl = document.getElementById('banker-score');
const betAmountEl = document.getElementById('bet-amount');
const resultEl = document.getElementById('result');
const aiCommentEl = document.getElementById('ai-comment');
const historyList = document.getElementById('history-list');

// Buttons
const dealButton = document.getElementById('deal-button');
const betPlayerButton = document.getElementById('bet-player');
const betBankerButton = document.getElementById('bet-banker');
const betTieButton = document.getElementById('bet-tie');
const betDecreaseButton = document.getElementById('bet-decrease');
const betIncreaseButton = document.getElementById('bet-increase');

function createDeck() {
    return suits.flatMap(suit => values.map(value => ({ suit, value })));
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function displayCards(container, cards, faceDown = false) {
    container.innerHTML = '';
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card' + (faceDown ? ' face-down' : '');
        
        if (!faceDown) {
            if (card.suit === '♥' || card.suit === '♦') {
                cardElement.className += ' red';
            }
            cardElement.innerHTML = `
                <div class="corner-value top-left">${card.value}</div>
                <div class="suit">${card.suit}</div>
                <div class="corner-value bottom-right">${card.value}</div>
            `;
        }
        container.appendChild(cardElement);
    });
}

function calculateBaccaratValue(cards) {
    return cards.reduce((total, card) => {
        let value = card.value;
        if (['J', 'Q', 'K'].includes(value)) value = '10';
        if (value === 'A') value = '1';
        return (total + parseInt(value)) % 10;
    }, 0);
}

function shouldDrawThirdCard(hand, isPlayer, otherHandThirdCard = null) {
    const score = calculateBaccaratValue(hand);
    
    if (hand.length !== 2) return false;
    
    if (isPlayer) {
        return score <= 5;
    } else {
        if (score >= 7) return false;
        if (score <= 2) return true;
        if (otherHandThirdCard === null) return score <= 5;
        
        if (score === 3 && otherHandThirdCard !== 8) return true;
        if (score === 4 && ![0, 1, 8, 9].includes(otherHandThirdCard)) return true;
        if (score === 5 && [4, 5, 6, 7].includes(otherHandThirdCard)) return true;
        if (score === 6 && [6, 7].includes(otherHandThirdCard)) return true;
        
        return false;
    }
}

function dealInitialCards() {
    playerHand = [deck.pop(), deck.pop()];
    bankerHand = [deck.pop(), deck.pop()];
    
    displayCards(playerCardsEl, playerHand);
    displayCards(bankerCardsEl, bankerHand);
    
    updateScores();
}

function updateScores() {
    const playerScore = calculateBaccaratValue(playerHand);
    const bankerScore = calculateBaccaratValue(bankerHand);
    
    playerScoreEl.textContent = `Score: ${playerScore}`;
    bankerScoreEl.textContent = `Score: ${bankerScore}`;
}

function getAIComment(stage, result = null) {
    const comments = {
        start: [
            "Let's see what the cards have in store for us!",
            "May fortune favor the bold!",
            "The tension builds as we begin..."
        ],
        draw: [
            "Interesting development...",
            "The plot thickens!",
            "This is getting exciting!"
        ],
        win: [
            "Congratulations on the win!",
            "Well played! The cards were in your favor.",
            "Victory is sweet!"
        ],
        lose: [
            "Better luck next time!",
            "Don't worry, the next hand could be yours.",
            "That's the way the cards fall sometimes."
        ]
    };
    
    return comments[stage][Math.floor(Math.random() * comments[stage].length)];
}

function updateBetButtons(enabled) {
    betPlayerButton.disabled = !enabled;
    betBankerButton.disabled = !enabled;
    betTieButton.disabled = !enabled;
    dealButton.disabled = enabled;
}

function selectBet(type) {
    selectedBet = type;
    [betPlayerButton, betBankerButton, betTieButton].forEach(button => {
        button.style.opacity = button.id === `bet-${type}` ? '0.7' : '1';
    });
    dealButton.disabled = false;
}

function addToHistory(result, playerScore, bankerScore) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <p>${result}</p>
        <p>Player: ${playerScore} - Banker: ${bankerScore}</p>
    `;
    historyList.insertBefore(historyItem, historyList.firstChild);
}

function playGame() {
    if (!selectedBet) {
        alert('Please select a bet type first!');
        return;
    }
    
    // Reset the table
    deck = createDeck();
    shuffle(deck);
    playerHand = [];
    bankerHand = [];
    
    // Initial deal
    dealInitialCards();
    aiCommentEl.textContent = getAIComment('start');
    
    // Draw additional cards according to rules
    const playerScore = calculateBaccaratValue(playerHand);
    let playerThirdCard = null;
    
    if (shouldDrawThirdCard(playerHand, true)) {
        playerThirdCard = deck.pop();
        playerHand.push(playerThirdCard);
        displayCards(playerCardsEl, playerHand);
        aiCommentEl.textContent = getAIComment('draw');
    }
    
    if (shouldDrawThirdCard(bankerHand, false, playerThirdCard ? calculateBaccaratValue([playerThirdCard]) : null)) {
        bankerHand.push(deck.pop());
        displayCards(bankerCardsEl, bankerHand);
        aiCommentEl.textContent = getAIComment('draw');
    }
    
    updateScores();
    
    // Determine winner
    const finalPlayerScore = calculateBaccaratValue(playerHand);
    const finalBankerScore = calculateBaccaratValue(bankerHand);
    let result;
    let earnings = 0;
    
    if (finalPlayerScore === finalBankerScore) {
        result = "Tie!";
        if (selectedBet === 'tie') {
            earnings = currentBet * 8;
            playerChips += earnings;
        }
    } else if (finalPlayerScore > finalBankerScore) {
        result = "Player wins!";
        if (selectedBet === 'player') {
            earnings = currentBet;
            playerChips += earnings;
        }
    } else {
        result = "Banker wins!";
        if (selectedBet === 'banker') {
            earnings = currentBet * 0.95;
            playerChips += earnings;
        }
    }
    
    if (earnings <= 0) {
        playerChips -= currentBet;
        earnings = -currentBet;
    }
    
    // Update statistics
    if (window.casinoAccount) {
        window.casinoAccount.updateStats('baccarat', earnings > 0, earnings);
    }
    
    resultEl.textContent = result;
    aiCommentEl.textContent = getAIComment(earnings > 0 ? 'win' : 'lose');
    addToHistory(result, finalPlayerScore, finalBankerScore);
    
    // Reset for next hand
    selectedBet = null;
    updateBetButtons(true);
    [betPlayerButton, betBankerButton, betTieButton].forEach(button => {
        button.style.opacity = '1';
    });
}

// Event Listeners
betDecreaseButton.addEventListener('click', () => {
    if (currentBet > 10) {
        currentBet -= 10;
        betAmountEl.textContent = `$${currentBet}`;
    }
});

betIncreaseButton.addEventListener('click', () => {
    if (currentBet < playerChips) {
        currentBet += 10;
        betAmountEl.textContent = `$${currentBet}`;
    }
});

betPlayerButton.addEventListener('click', () => selectBet('player'));
betBankerButton.addEventListener('click', () => selectBet('banker'));
betTieButton.addEventListener('click', () => selectBet('tie'));
dealButton.addEventListener('click', playGame);

// Initialize
updateBetButtons(true);
dealButton.disabled = true; 