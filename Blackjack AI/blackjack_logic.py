import random

suits = ['♠', '♥', '♦', '♣']
values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

def create_deck():
    return [{'suit': suit, 'value': value} for suit in suits for value in values]

def shuffle_deck(deck):
    random.shuffle(deck)

def calculate_score(hand):
    score = 0
    aces = 0
    for card in hand:
        value = card['value']
        if value in ['K', 'Q', 'J']:
            score += 10
        elif value == 'A':
            score += 11
            aces += 1
        else:
            score += int(value)

    while score > 21 and aces:
        score -= 10
        aces -= 1

    return score

def deal_hand(deck, count=2):
    return [deck.pop() for _ in range(count)]

def dealer_play(deck, dealer_hand):
    while calculate_score(dealer_hand) < 17:
        dealer_hand.append(deck.pop())
    return dealer_hand

def determine_winner(player_score, dealer_score):
    if player_score > 21:
        return 'Dealer wins (Player busted)'
    elif dealer_score > 21:
        return 'Player wins (Dealer busted)'
    elif player_score > dealer_score:
        return 'Player wins'
    elif dealer_score > player_score:
        return 'Dealer wins'
    else:
        return 'Push (Tie)'

def get_sarcastic_comment(stage, result=''):
    comments = {
        'start': [
            "Oh, you're back? Ready to lose again?",
            "Let's see how fast this goes south.",
            "Dealing cards... not hope."
        ],
        'hit': [
            "Another card? Feeling lucky, punk?",
            "Living on the edge, huh?",
            "Bold choice. Let's see how badly it goes."
        ],
        'stand': [
            "Standing? I thought you were braver than that.",
            "Let the real game begin.",
            "Oh? Playing it safe? Boooring."
        ],
        'end': [
            "Wow. Didn't expect that... still disappointed.",
            "Game over. You win nothing. Good day, sir.",
            "Was that your best? Yikes."
        ]
    }

    if stage == 'end':
        if 'Player wins' in result:
            return "You won? Is this a prank?"
        elif 'Dealer wins' in result:
            return "As expected. Dealer reigns."
        elif 'Push' in result:
            return "A tie? That’s just lazy."

    return random.choice(comments.get(stage, ["Meh."]))
