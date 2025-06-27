const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const valueMap = Object.fromEntries(values.map((v, i) => [v, i]));

let deck = [];
let communityCards = [];
let playerHoleCards = [];
let aiHoleCards = [];
let gameStage = 'pre-deal'; // pre-deal, pre-flop, flop, turn, river, showdown
let currentBet = 0;
let potSize = 0;
let playerChips = 1000;
let aiChips = 1000;
let betAmount = 50;

// DOM Elements
const communityCardsEl = document.getElementById('community-cards');
const playerCardsEl = document.getElementById('player-cards');
const aiCardsEl = document.getElementById('ai-cards');
const playerChipsEl = document.getElementById('player-chips');
const aiChipsEl = document.getElementById('ai-chips');
const playerBetEl = document.getElementById('player-bet');
const aiBetEl = document.getElementById('ai-bet');
const betAmountEl = document.getElementById('bet-amount');
const resultEl = document.getElementById('result');
const aiCommentEl = document.getElementById('ai-comment');
const historyList = document.getElementById('history-list');

// Buttons
const dealButton = document.getElementById('deal-button');
const foldButton = document.getElementById('fold-button');
const callButton = document.getElementById('call-button');
const raiseButton = document.getElementById('raise-button');
const betDecreaseButton = document.getElementById('bet-decrease');
const betIncreaseButton = document.getElementById('bet-increase');

class PokerHand {
    constructor(cards) {
        this.cards = cards;
        this.valueCounts = this.countValues();
        this.suitCounts = this.countSuits();
        this.values = this.getValuesSorted();
    }

    countValues() {
        return this.cards.reduce((counts, card) => {
            counts[card.value] = (counts[card.value] || 0) + 1;
            return counts;
        }, {});
    }

    countSuits() {
        return this.cards.reduce((counts, card) => {
            counts[card.suit] = (counts[card.suit] || 0) + 1;
            return counts;
        }, {});
    }

    getValuesSorted() {
        return this.cards
            .map(card => valueMap[card.value])
            .sort((a, b) => b - a);
    }

    isFlush() {
        return Object.values(this.suitCounts).some(count => count >= 5);
    }

    isStraight() {
        if (this.values.length < 5) return false;
        
        // Check for Ace-low straight
        if (JSON.stringify(this.values.slice(0, 5)) === '[12,3,2,1,0]') {
            return true;
        }
        
        // Check for normal straight
        for (let i = 0; i <= this.values.length - 5; i++) {
            if (this.values[i] - this.values[i + 4] === 4) {
                return true;
            }
        }
        return false;
    }

    getRank() {
        const isFlush = this.isFlush();
        const isStraight = this.isStraight();

        if (isFlush && isStraight) {
            return [8, this.values.slice(0, 5)]; // Straight flush
        }

        // Four of a kind
        const quads = Object.entries(this.valueCounts).find(([_, count]) => count === 4);
        if (quads) {
            const kicker = Object.entries(this.valueCounts)
                .find(([_, count]) => count === 1);
            return [7, [valueMap[quads[0]], valueMap[kicker[0]]]];
        }

        // Full house
        const hasThree = Object.values(this.valueCounts).includes(3);
        const hasTwo = Object.values(this.valueCounts).includes(2);
        if (hasThree && hasTwo) {
            const trips = Object.entries(this.valueCounts)
                .find(([_, count]) => count === 3)[0];
            const pair = Object.entries(this.valueCounts)
                .find(([_, count]) => count === 2)[0];
            return [6, [valueMap[trips], valueMap[pair]]];
        }

        if (isFlush) {
            return [5, this.values.slice(0, 5)]; // Flush
        }

        if (isStraight) {
            return [4, this.values.slice(0, 5)]; // Straight
        }

        // Three of a kind
        if (hasThree) {
            const trips = Object.entries(this.valueCounts)
                .find(([_, count]) => count === 3)[0];
            const kickers = Object.entries(this.valueCounts)
                .filter(([_, count]) => count === 1)
                .map(([value, _]) => valueMap[value])
                .sort((a, b) => b - a)
                .slice(0, 2);
            return [3, [valueMap[trips], ...kickers]];
        }

        // Two pair
        const pairs = Object.entries(this.valueCounts)
            .filter(([_, count]) => count === 2)
            .map(([value, _]) => valueMap[value])
            .sort((a, b) => b - a);
        
        if (pairs.length === 2) {
            const kicker = Object.entries(this.valueCounts)
                .find(([_, count]) => count === 1)[0];
            return [2, [...pairs, valueMap[kicker]]];
        }

        // One pair
        if (pairs.length === 1) {
            const kickers = Object.entries(this.valueCounts)
                .filter(([_, count]) => count === 1)
                .map(([value, _]) => valueMap[value])
                .sort((a, b) => b - a)
                .slice(0, 3);
            return [1, [pairs[0], ...kickers]];
        }

        return [0, this.values.slice(0, 5)]; // High card
    }
}

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
        cardElement.className = 'card' + (faceDown ? ' face-down poker' : '');
        
        if (!faceDown) {
            if (card.suit === '♥' || card.suit === '♦') {
                cardElement.className += ' red';
            }

            const topCorner = document.createElement('div');
            topCorner.className = 'corner-value top-left';
            topCorner.textContent = card.value;

            const bottomCorner = document.createElement('div');
            bottomCorner.className = 'corner-value bottom-right';
            bottomCorner.textContent = card.value;

            const centerValue = document.createElement('div');
            centerValue.className = 'value';
            centerValue.textContent = card.value;

            const centerSuit = document.createElement('div');
            centerSuit.className = 'suit';
            centerSuit.textContent = card.suit;

            cardElement.appendChild(topCorner);
            cardElement.appendChild(centerValue);
            cardElement.appendChild(centerSuit);
            cardElement.appendChild(bottomCorner);
        }

        container.appendChild(cardElement);
    });
}

function evaluateHand(holeCards, communityCards) {
    const hand = new PokerHand([...holeCards, ...communityCards]);
    const [rank, values] = hand.getRank();
    
    const handNames = [
        "High Card",
        "One Pair",
        "Two Pair",
        "Three of a Kind",
        "Straight",
        "Flush",
        "Full House",
        "Four of a Kind",
        "Straight Flush"
    ];
    
    return { rank, values, name: handNames[rank] };
}

function getAIAction(aiHandRank, aiHoleCards, communityCards, potSize, currentBet, aiChips) {
    const handStrength = aiHandRank / 8; // Normalize rank to 0-1
    const potOdds = currentBet / (potSize + currentBet);
    
    if (handStrength < 0.2) { // Very weak hand
        if (currentBet > 0) {
            return { action: 'fold', amount: 0 };
        }
        return { action: 'check', amount: 0 };
    }
    
    if (handStrength > 0.7) { // Very strong hand
        const raiseAmount = Math.min(currentBet * 2, aiChips);
        return { action: 'raise', amount: raiseAmount };
    }
    
    if (handStrength > potOdds) { // Hand is strong enough to call
        return { action: 'call', amount: currentBet };
    }
    
    return { action: 'fold', amount: 0 };
}

function getAIComment(action, handStrength) {
    const comments = {
        fold: [
            "This hand is trash. I'm out.",
            "Not worth my virtual chips.",
            "Sometimes you have to know when to fold 'em."
        ],
        check: [
            "I'll let you have this one... for now.",
            "Nothing exciting here.",
            "Let's see what develops."
        ],
        call: [
            "I'll see your bet.",
            "Interesting... I'm in.",
            "You're not scaring me away that easily."
        ],
        raise: [
            "Time to make this interesting.",
            "Hope you brought your wallet.",
            "Let's see if you can handle the pressure."
        ]
    };
    
    if (handStrength > 0.8) {
        comments.raise.push(
            "I've got you right where I want you.",
            "This is going to be expensive for you."
        );
    }
    
    return comments[action][Math.floor(Math.random() * comments[action].length)];
}

function updateChipsDisplay() {
    playerChipsEl.textContent = `Chips: $${playerChips}`;
    aiChipsEl.textContent = `Chips: $${aiChips}`;
    playerBetEl.textContent = `Bet: $${currentBet}`;
    aiBetEl.textContent = `Bet: $${currentBet}`;
    betAmountEl.textContent = `$${betAmount}`;
}

function addToHistory(playerHand, aiHand, communityCards, result) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const gameNumber = document.createElement('div');
    gameNumber.className = 'game-number';
    gameNumber.textContent = `Hand #${document.querySelectorAll('.history-item').length + 1}`;
    
    const hands = document.createElement('div');
    hands.className = 'hands';
    
    // Community cards
    const communitySection = document.createElement('div');
    communitySection.innerHTML = '<strong>Community:</strong>';
    const communityDisplay = document.createElement('div');
    communityDisplay.className = 'mini-cards';
    communityCards.forEach(card => {
        const miniCard = document.createElement('span');
        miniCard.className = 'mini-card' + (card.suit === '♥' || card.suit === '♦' ? ' red' : '');
        miniCard.textContent = `${card.value}${card.suit}`;
        communityDisplay.appendChild(miniCard);
    });
    communitySection.appendChild(communityDisplay);
    
    // Player's hand
    const playerSection = document.createElement('div');
    playerSection.innerHTML = `<strong>Your Hand:</strong>`;
    const playerCards = document.createElement('div');
    playerCards.className = 'mini-cards';
    playerHand.forEach(card => {
        const miniCard = document.createElement('span');
        miniCard.className = 'mini-card' + (card.suit === '♥' || card.suit === '♦' ? ' red' : '');
        miniCard.textContent = `${card.value}${card.suit}`;
        playerCards.appendChild(miniCard);
    });
    playerSection.appendChild(playerCards);
    
    // AI's hand
    const aiSection = document.createElement('div');
    aiSection.innerHTML = `<strong>AI Hand:</strong>`;
    const aiCards = document.createElement('div');
    aiCards.className = 'mini-cards';
    aiHand.forEach(card => {
        const miniCard = document.createElement('span');
        miniCard.className = 'mini-card' + (card.suit === '♥' || card.suit === '♦' ? ' red' : '');
        miniCard.textContent = `${card.value}${card.suit}`;
        aiCards.appendChild(miniCard);
    });
    aiSection.appendChild(aiCards);
    
    const resultText = document.createElement('div');
    resultText.className = 'result';
    resultText.textContent = result;
    
    hands.appendChild(communitySection);
    hands.appendChild(playerSection);
    hands.appendChild(aiSection);
    
    historyItem.appendChild(gameNumber);
    historyItem.appendChild(hands);
    historyItem.appendChild(resultText);
    
    historyList.insertBefore(historyItem, historyList.firstChild);
    
    // Keep only last 10 hands
    while (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
}

// Event Listeners
dealButton.addEventListener('click', () => {
    // Reset game state
    deck = createDeck();
    shuffle(deck);
    communityCards = [];
    playerHoleCards = [];
    aiHoleCards = [];
    gameStage = 'pre-flop';
    currentBet = 0;
    potSize = 0;
    
    // Deal hole cards
    playerHoleCards = [deck.pop(), deck.pop()];
    aiHoleCards = [deck.pop(), deck.pop()];
    
    // Update display
    displayCards(playerCardsEl, playerHoleCards);
    displayCards(aiCardsEl, aiHoleCards, true);
    displayCards(communityCardsEl, []);
    
    // Enable buttons
    foldButton.disabled = false;
    callButton.disabled = false;
    raiseButton.disabled = false;
    dealButton.disabled = true;
    
    updateChipsDisplay();
    resultEl.textContent = '';
    aiCommentEl.textContent = "Your move, hotshot.";
});

betDecreaseButton.addEventListener('click', () => {
    if (betAmount > 50) {
        betAmount -= 50;
        betAmountEl.textContent = `$${betAmount}`;
    }
});

betIncreaseButton.addEventListener('click', () => {
    if (betAmount < playerChips) {
        betAmount += 50;
        betAmountEl.textContent = `$${betAmount}`;
    }
});

function handlePlayerAction(action) {
    switch (action) {
        case 'fold':
            endHand('AI wins - player folded');
            break;
            
        case 'call':
            if (playerChips >= currentBet) {
                potSize += currentBet * 2;
                playerChips -= currentBet;
                aiChips -= currentBet;
                progressHand();
            }
            break;
            
        case 'raise':
            if (playerChips >= betAmount) {
                currentBet = betAmount;
                potSize += betAmount * 2;
                playerChips -= betAmount;
                aiChips -= betAmount;
                progressHand();
            }
            break;
    }
    
    updateChipsDisplay();
}

function progressHand() {
    switch (gameStage) {
        case 'pre-flop':
            gameStage = 'flop';
            communityCards = [...communityCards, deck.pop(), deck.pop(), deck.pop()];
            break;
            
        case 'flop':
            gameStage = 'turn';
            communityCards.push(deck.pop());
            break;
            
        case 'turn':
            gameStage = 'river';
            communityCards.push(deck.pop());
            break;
            
        case 'river':
            gameStage = 'showdown';
            endHand();
            return;
    }
    
    displayCards(communityCardsEl, communityCards);
    
    // AI decision
    const aiHand = evaluateHand(aiHoleCards, communityCards);
    const { action, amount } = getAIAction(aiHand.rank, aiHoleCards, communityCards, potSize, currentBet, aiChips);
    aiCommentEl.textContent = getAIComment(action, aiHand.rank / 8);
    
    if (action === 'fold') {
        endHand('Player wins - AI folded');
    } else if (action === 'raise') {
        currentBet = amount;
        updateChipsDisplay();
    }
}

function endHand(result) {
    gameStage = 'pre-deal';
    displayCards(aiCardsEl, aiHoleCards, false);
    
    if (!result) {
        const playerHand = evaluateHand(playerHoleCards, communityCards);
        const aiHand = evaluateHand(aiHoleCards, communityCards);
        
        if (playerHand.rank > aiHand.rank || 
            (playerHand.rank === aiHand.rank && 
             playerHand.values[0] > aiHand.values[0])) {
            result = `Player wins with ${playerHand.name}`;
            playerChips += potSize;
        } else {
            result = `AI wins with ${aiHand.name}`;
            aiChips += potSize;
        }
    }
    
    // Calculate earnings (change in chips from initial 1000)
    const earnings = playerChips - 1000;
    
    // Update statistics
    if (window.casinoAccount) {
        window.casinoAccount.updateStats('poker', result.startsWith('Player wins'), earnings);
    }
    
    resultEl.textContent = result;
    addToHistory(playerHoleCards, aiHoleCards, communityCards, result);
    
    // Reset game state
    currentBet = 0;
    potSize = 0;
    
    // Reset buttons
    foldButton.disabled = true;
    callButton.disabled = true;
    raiseButton.disabled = true;
    dealButton.disabled = false;
    
    updateChipsDisplay();
    
    // Show AI comment about the hand
    const aiComment = getAIComment('end', aiHand ? aiHand.rank / 8 : 0);
    aiCommentEl.textContent = aiComment;
}

foldButton.addEventListener('click', () => handlePlayerAction('fold'));
callButton.addEventListener('click', () => handlePlayerAction('call'));
raiseButton.addEventListener('click', () => handlePlayerAction('raise')); 