let currentBet = 50;
let selectedBet = null;
let playerChips = 1000;
let point = null;
let currentBets = {
    passLine: 0,
    dontPass: 0,
    come: 0,
    field: 0
};

// DOM Elements
const dice1El = document.getElementById('dice1');
const dice2El = document.getElementById('dice2');
const pointEl = document.getElementById('point');
const betAmountEl = document.getElementById('bet-amount');
const resultEl = document.getElementById('result');
const aiCommentEl = document.getElementById('ai-comment');
const historyList = document.getElementById('history-list');

// Buttons
const rollButton = document.getElementById('roll-button');
const betPassButton = document.getElementById('bet-pass');
const betDontPassButton = document.getElementById('bet-dont-pass');
const betComeButton = document.getElementById('bet-come');
const betFieldButton = document.getElementById('bet-field');
const betDecreaseButton = document.getElementById('bet-decrease');
const betIncreaseButton = document.getElementById('bet-increase');

function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

function updateDiceDisplay(dice1, dice2) {
    // Add rolling animation class
    dice1El.classList.add('rolling');
    dice2El.classList.add('rolling');
    
    // Set the final values after a delay to match the animation
    setTimeout(() => {
        dice1El.setAttribute('data-value', dice1);
        dice2El.setAttribute('data-value', dice2);
        
        // Remove the rolling class after animation
        setTimeout(() => {
            dice1El.classList.remove('rolling');
            dice2El.classList.remove('rolling');
        }, 600);
    }, 300);
}

function getAIComment(stage, roll = null) {
    const comments = {
        comeOut: [
            "New shooter! Place your bets!",
            "Let's see what the dice have in store!",
            "Time for the come out roll!"
        ],
        point: [
            "Point is on! Looking for that " + point,
            "Can you hit the point?",
            "Keep rolling!"
        ],
        win: [
            "Winner winner! Great roll!",
            "That's how it's done!",
            "Excellent shooting!"
        ],
        lose: [
            "Better luck on the next roll!",
            "That's a tough break.",
            "Don't worry, your luck will turn around!"
        ]
    };
    
    return comments[stage][Math.floor(Math.random() * comments[stage].length)];
}

function updateBetButtons(comeOut) {
    betPassButton.disabled = !comeOut;
    betDontPassButton.disabled = !comeOut;
    betComeButton.disabled = comeOut;
    betFieldButton.disabled = false;
}

function addToHistory(roll1, roll2, result) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <p>Dice: ${roll1} + ${roll2} = ${roll1 + roll2}</p>
        <p>${result}</p>
    `;
    historyList.insertBefore(historyItem, historyList.firstChild);
}

function handleFieldBet(total) {
    if ([2, 3, 4, 9, 10, 11, 12].includes(total)) {
        let multiplier = 1;
        if (total === 2 || total === 12) multiplier = 2;
        
        const winnings = currentBets.field * multiplier;
        playerChips += winnings;
        return `Field bet wins! +$${winnings}`;
    } else {
        playerChips -= currentBets.field;
        return `Field bet loses! -$${currentBets.field}`;
    }
}

function placeBet(type) {
    if (currentBet > playerChips) {
        alert("Not enough chips!");
        return;
    }
    
    currentBets[type] = currentBet;
    playerChips -= currentBet;
    
    if (type === 'passLine' || type === 'dontPass') {
        betPassButton.disabled = true;
        betDontPassButton.disabled = true;
    }
}

function playGame() {
    // Disable roll button during animation
    rollButton.disabled = true;
    
    const dice1 = rollDice();
    const dice2 = rollDice();
    const total = dice1 + dice2;
    
    updateDiceDisplay(dice1, dice2);
    let result = '';
    let earnings = 0;
    
    // Delay the game logic to match the animation
    setTimeout(() => {
        // Handle field bet first (it works the same regardless of point)
        if (currentBets.field > 0) {
            result += handleFieldBet(total) + '\n';
        }
        
        if (point === null) { // Come out roll
            if (total === 7 || total === 11) {
                if (currentBets.passLine > 0) {
                    playerChips += currentBets.passLine * 2;
                    earnings += currentBets.passLine;
                    result += "Pass line wins!\n";
                }
                if (currentBets.dontPass > 0) {
                    earnings -= currentBets.dontPass;
                    result += "Don't pass loses!\n";
                }
                aiCommentEl.textContent = getAIComment('win');
            } else if (total === 2 || total === 3 || total === 12) {
                if (currentBets.passLine > 0) {
                    earnings -= currentBets.passLine;
                    result += "Pass line loses!\n";
                }
                if (currentBets.dontPass > 0) {
                    playerChips += currentBets.dontPass * 2;
                    earnings += currentBets.dontPass;
                    result += "Don't pass wins!\n";
                }
                aiCommentEl.textContent = getAIComment('lose');
            } else {
                point = total;
                pointEl.textContent = point;
                updateBetButtons(false);
                aiCommentEl.textContent = getAIComment('point');
                result = `Point is ${point}`;
            }
        } else { // Point is set
            if (total === point) {
                if (currentBets.passLine > 0) {
                    playerChips += currentBets.passLine * 2;
                    earnings += currentBets.passLine;
                    result += "Pass line wins!\n";
                }
                if (currentBets.dontPass > 0) {
                    earnings -= currentBets.dontPass;
                    result += "Don't pass loses!\n";
                }
                point = null;
                pointEl.textContent = 'Off';
                updateBetButtons(true);
                aiCommentEl.textContent = getAIComment('win');
            } else if (total === 7) {
                if (currentBets.passLine > 0) {
                    earnings -= currentBets.passLine;
                    result += "Pass line loses!\n";
                }
                if (currentBets.dontPass > 0) {
                    playerChips += currentBets.dontPass * 2;
                    earnings += currentBets.dontPass;
                    result += "Don't pass wins!\n";
                }
                point = null;
                pointEl.textContent = 'Off';
                updateBetButtons(true);
                aiCommentEl.textContent = getAIComment('lose');
            }
        }
        
        // Update statistics
        if (window.casinoAccount) {
            window.casinoAccount.updateStats('craps', earnings > 0, earnings);
        }
        
        resultEl.textContent = result;
        addToHistory(dice1, dice2, result);
        
        // Reset bets
        currentBets = {
            passLine: 0,
            dontPass: 0,
            come: 0,
            field: 0
        };
        
        // Re-enable roll button
        rollButton.disabled = false;
    }, 900); // Wait for dice animation to complete
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

betPassButton.addEventListener('click', () => placeBet('passLine'));
betDontPassButton.addEventListener('click', () => placeBet('dontPass'));
betComeButton.addEventListener('click', () => placeBet('come'));
betFieldButton.addEventListener('click', () => placeBet('field'));
rollButton.addEventListener('click', playGame);

// Initialize
updateBetButtons(true);
aiCommentEl.textContent = getAIComment('comeOut'); 