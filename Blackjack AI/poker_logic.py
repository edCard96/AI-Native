import random
from collections import Counter
from typing import List, Dict, Tuple

suits = ['♠', '♥', '♦', '♣']
values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
value_map = {v: i for i, v in enumerate(values)}

class PokerHand:
    def __init__(self, cards):
        self.cards = cards
        self.value_counts = Counter(card['value'] for card in cards)
        self.suit_counts = Counter(card['suit'] for card in cards)
        self.values = sorted([value_map[card['value']] for card in cards], reverse=True)
        
    def is_flush(self) -> bool:
        return any(count >= 5 for count in self.suit_counts.values())
        
    def is_straight(self) -> bool:
        if len(self.values) < 5:
            return False
        # Check for Ace-low straight
        if self.values == [12, 3, 2, 1, 0]:
            return True
        # Check for normal straight
        for i in range(len(self.values) - 4):
            if self.values[i] - self.values[i + 4] == 4:
                return True
        return False
        
    def get_rank(self) -> Tuple[int, List[int]]:
        # Returns (hand_rank, [value ranks for tie-breaking])
        is_flush = self.is_flush()
        is_straight = self.is_straight()
        
        if is_flush and is_straight:
            return (8, self.values[:5])  # Straight flush
            
        if 4 in self.value_counts.values():
            quads = max(v for v, count in self.value_counts.items() if count == 4)
            kicker = max(v for v, count in self.value_counts.items() if count == 1)
            return (7, [value_map[quads], value_map[kicker]])  # Four of a kind
            
        if 3 in self.value_counts.values() and 2 in self.value_counts.values():
            trips = max(v for v, count in self.value_counts.items() if count == 3)
            pair = max(v for v, count in self.value_counts.items() if count == 2)
            return (6, [value_map[trips], value_map[pair]])  # Full house
            
        if is_flush:
            return (5, self.values[:5])  # Flush
            
        if is_straight:
            return (4, self.values[:5])  # Straight
            
        if 3 in self.value_counts.values():
            trips = max(v for v, count in self.value_counts.items() if count == 3)
            kickers = sorted([value_map[v] for v, count in self.value_counts.items() if count == 1], reverse=True)
            return (3, [value_map[trips]] + kickers[:2])  # Three of a kind
            
        pairs = [v for v, count in self.value_counts.items() if count == 2]
        if len(pairs) == 2:
            pairs = sorted([value_map[p] for p in pairs], reverse=True)
            kicker = max(value_map[v] for v, count in self.value_counts.items() if count == 1)
            return (2, pairs + [kicker])  # Two pair
            
        if len(pairs) == 1:
            pair = pairs[0]
            kickers = sorted([value_map[v] for v, count in self.value_counts.items() if count == 1], reverse=True)
            return (1, [value_map[pair]] + kickers[:3])  # One pair
            
        return (0, self.values[:5])  # High card

def create_deck() -> List[Dict]:
    return [{'suit': suit, 'value': value} for suit in suits for value in values]

def shuffle_deck(deck: List[Dict]) -> None:
    random.shuffle(deck)

def deal_hole_cards(deck: List[Dict], num_cards: int = 2) -> List[Dict]:
    return [deck.pop() for _ in range(num_cards)]

def deal_community_cards(deck: List[Dict], num_cards: int) -> List[Dict]:
    return [deck.pop() for _ in range(num_cards)]

def evaluate_hand(hole_cards: List[Dict], community_cards: List[Dict]) -> Tuple[int, List[int], str]:
    all_cards = hole_cards + community_cards
    hand = PokerHand(all_cards)
    rank, values = hand.get_rank()
    
    hand_names = [
        "High Card",
        "One Pair",
        "Two Pair",
        "Three of a Kind",
        "Straight",
        "Flush",
        "Full House",
        "Four of a Kind",
        "Straight Flush"
    ]
    
    return rank, values, hand_names[rank]

def get_ai_action(ai_hand_rank: int, ai_hole_cards: List[Dict], community_cards: List[Dict], 
                  pot_size: int, current_bet: int, ai_chips: int) -> Tuple[str, int]:
    # Simple AI strategy
    hand_strength = ai_hand_rank / 8  # Normalize rank to 0-1
    pot_odds = current_bet / (pot_size + current_bet)
    
    if hand_strength < 0.2:  # Very weak hand
        if current_bet > 0:
            return 'fold', 0
        return 'check', 0
        
    if hand_strength > 0.7:  # Very strong hand
        raise_amount = min(current_bet * 2, ai_chips)
        return 'raise', raise_amount
        
    if hand_strength > pot_odds:  # Hand is strong enough to call
        return 'call', current_bet
        
    return 'fold', 0

def get_ai_comment(action: str, hand_strength: float) -> str:
    comments = {
        'fold': [
            "This hand is trash. I'm out.",
            "Not worth my virtual chips.",
            "Sometimes you have to know when to fold 'em."
        ],
        'check': [
            "I'll let you have this one... for now.",
            "Nothing exciting here.",
            "Let's see what develops."
        ],
        'call': [
            "I'll see your bet.",
            "Interesting... I'm in.",
            "You're not scaring me away that easily."
        ],
        'raise': [
            "Time to make this interesting.",
            "Hope you brought your wallet.",
            "Let's see if you can handle the pressure."
        ]
    }
    
    if hand_strength > 0.8:
        comments['raise'].extend([
            "I've got you right where I want you.",
            "This is going to be expensive for you."
        ])
    
    return random.choice(comments.get(action, ["Hmm..."]))) 