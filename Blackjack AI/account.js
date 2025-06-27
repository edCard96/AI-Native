// User account state
let currentUser = {
    isLoggedIn: false,
    username: 'Guest',
    avatar: 'CardHand.png',
    memberSince: new Date().toLocaleDateString(),
    stats: {
        blackjack: {
            gamesPlayed: 0,
            wins: 0,
            earnings: 0
        },
        poker: {
            gamesPlayed: 0,
            wins: 0,
            earnings: 0
        },
        baccarat: {
            gamesPlayed: 0,
            wins: 0,
            earnings: 0
        },
        craps: {
            gamesPlayed: 0,
            wins: 0,
            earnings: 0
        }
    },
    achievements: []
};

// Load user data from localStorage if it exists
function loadUserData() {
    const savedUser = localStorage.getItem('casinoUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUI();
    }
}

// Save user data to localStorage
function saveUserData() {
    localStorage.setItem('casinoUser', JSON.stringify(currentUser));
}

// Update the UI with current user data
function updateUI() {
    // Update profile section
    document.getElementById('player-name').textContent = currentUser.username;
    document.getElementById('profile-avatar').src = currentUser.avatar;
    document.querySelector('#member-since span').textContent = currentUser.memberSince;

    // Update Blackjack stats
    const bjStats = currentUser.stats.blackjack;
    document.getElementById('blackjack-games').textContent = bjStats.gamesPlayed;
    document.getElementById('blackjack-wins').textContent = bjStats.wins;
    document.getElementById('blackjack-winrate').textContent = 
        bjStats.gamesPlayed > 0 ? 
        ((bjStats.wins / bjStats.gamesPlayed) * 100).toFixed(1) + '%' : 
        '0%';
    document.getElementById('blackjack-earnings').textContent = 
        '$' + bjStats.earnings.toFixed(2);

    // Update Poker stats
    const pokerStats = currentUser.stats.poker;
    document.getElementById('poker-games').textContent = pokerStats.gamesPlayed;
    document.getElementById('poker-wins').textContent = pokerStats.wins;
    document.getElementById('poker-winrate').textContent = 
        pokerStats.gamesPlayed > 0 ? 
        ((pokerStats.wins / pokerStats.gamesPlayed) * 100).toFixed(1) + '%' : 
        '0%';
    document.getElementById('poker-earnings').textContent = 
        '$' + pokerStats.earnings.toFixed(2);

    // Update Baccarat stats
    const baccaratStats = currentUser.stats.baccarat;
    document.getElementById('baccarat-games').textContent = baccaratStats.gamesPlayed;
    document.getElementById('baccarat-wins').textContent = baccaratStats.wins;
    document.getElementById('baccarat-winrate').textContent = 
        baccaratStats.gamesPlayed > 0 ? 
        ((baccaratStats.wins / baccaratStats.gamesPlayed) * 100).toFixed(1) + '%' : 
        '0%';
    document.getElementById('baccarat-earnings').textContent = 
        '$' + baccaratStats.earnings.toFixed(2);

    // Update Craps stats
    const crapsStats = currentUser.stats.craps;
    document.getElementById('craps-games').textContent = crapsStats.gamesPlayed;
    document.getElementById('craps-wins').textContent = crapsStats.wins;
    document.getElementById('craps-winrate').textContent = 
        crapsStats.gamesPlayed > 0 ? 
        ((crapsStats.wins / crapsStats.gamesPlayed) * 100).toFixed(1) + '%' : 
        '0%';
    document.getElementById('craps-earnings').textContent = 
        '$' + crapsStats.earnings.toFixed(2);

    // Update achievements
    updateAchievements();
}

// Update achievements section
function updateAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';

    if (currentUser.achievements.length === 0) {
        achievementsList.innerHTML = '<p>No achievements yet. Keep playing to earn some!</p>';
        return;
    }

    currentUser.achievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = 'achievement';
        achievementElement.innerHTML = `
            <h3>${achievement.title}</h3>
            <p>${achievement.description}</p>
            <span class="date-earned">Earned: ${achievement.dateEarned}</span>
        `;
        achievementsList.appendChild(achievementElement);
    });
}

// Check for new achievements
function checkAchievements() {
    const bjStats = currentUser.stats.blackjack;
    const pokerStats = currentUser.stats.poker;
    
    // Example achievement checks
    if (bjStats.wins >= 10 && !hasAchievement('Blackjack Master')) {
        addAchievement('Blackjack Master', 'Win 10 games of Blackjack');
    }
    
    if (pokerStats.wins >= 10 && !hasAchievement('Poker Pro')) {
        addAchievement('Poker Pro', 'Win 10 games of Poker');
    }

    if (bjStats.earnings >= 1000 && !hasAchievement('High Roller')) {
        addAchievement('High Roller', 'Earn $1000 in Blackjack');
    }
}

// Helper function to check if user has an achievement
function hasAchievement(title) {
    return currentUser.achievements.some(a => a.title === title);
}

// Add a new achievement
function addAchievement(title, description) {
    currentUser.achievements.push({
        title,
        description,
        dateEarned: new Date().toLocaleDateString()
    });
    saveUserData();
    updateAchievements();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    updateUI();
});

// Export functions for use in other files
window.casinoAccount = {
    updateStats: function(game, won, earnings) {
        currentUser.stats[game].gamesPlayed++;
        if (won) currentUser.stats[game].wins++;
        currentUser.stats[game].earnings += earnings;
        checkAchievements();
        saveUserData();
    },
    getCurrentUser: function() {
        return currentUser;
    }
}; 