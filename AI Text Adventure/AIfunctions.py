import json
import uuid # For generating unique IDs for NPCs and Quests
from typing import Dict, List, Any, Optional

# --- 1. Game State Management ---

# Initializing a global game state for simplicity.
# In a larger application, this might be a class instance or managed via a database.
game_state: Dict[str, Any] = {
    "current_scene": {
        "description": "",
        "available_choices": [],
        "npcs_present": [],
        "items_present": [],
        "active_quests": [],
    },
    "player_state": {
        "inventory": [],
        "health": 100,
        "mana": 50,
        "location_history": [],
        "reputation": {}, # e.g., {"faction_a": 0, "faction_b": 0}
    },
    "narrative_history": [], # Stores past descriptions and player choices
    "npcs_data": {}, # Stores details of all known NPCs
    "quests_data": {}, # Stores details of all known quests
    "secret_world_parameters": { # Hidden AI knowledge, not directly exposed to player
        "relic_location": "Whispering Caves",
        "main_antagonist": "Shadow Lord",
        "ancient_lore": "The Great Calamity was caused by ancient magic.",
    }
}

# --- 2. Helper Functions for AI Interaction ---

def _construct_ai_prompt(
    current_game_state: Dict[str, Any],
    player_input: str,
    context_type: str, # e.g., "initial_scene", "next_turn", "npc_dialogue", "quest_trigger"
    npc_id: Optional[str] = None # Used for NPC-specific prompts
) -> str:
    """
    Constructs the prompt for the AI based on the current game state and context.

    Args:
        current_game_state: The current state of the game.
        player_input: The player's last choice or custom action.
        context_type: Specifies what kind of AI output is needed.
        npc_id: Optional ID of the NPC being interacted with.

    Returns:
        A string representing the prompt for the LLM.
    """
    history_context = "\n".join(current_game_state["narrative_history"][-5:]) # Last 5 turns
    player_inventory = ", ".join(current_game_state["player_state"]["inventory"]) or "nothing"
    active_quests_summaries = [
        f"{qid}: {qd['description']} (Status: {qd['status']})"
        for qid, qd in current_game_state["quests_data"].items()
        if qd["status"] == "active"
    ]
    active_quests_str = "\n".join(active_quests_summaries) or "No active quests."
    npcs_in_scene = [
        f"{nid}: {current_game_state['npcs_data'][nid]['name']} (Traits: {current_game_state['npcs_data'][nid]['personality_traits']})"
        for nid in current_game_state["current_scene"]["npcs_present"]
        if nid in current_game_state["npcs_data"]
    ]
    npcs_str = "\n".join(npcs_in_scene) or "No NPCs present."

    base_prompt = f"""
    You are an AI Dungeon Master for a text-based adventure game.
    Current Game State Snapshot:
    - Player Health: {current_game_state["player_state"]["health"]}
    - Player Inventory: {player_inventory}
    - Active Quests:
    {active_quests_str}
    - NPCs in current scene:
    {npcs_str}
    - Recent Narrative History:
    {history_context}
    - Player's Last Action: "{player_input}"

    Based on this, generate content for the game. Your response should be a JSON object with the following keys:
    - "scene_description": A detailed description of the next scene/situation.
    - "available_choices": An array of 3-5 distinct, concise choices the player can make.
    - "new_npcs_introduced": An optional array of new NPC objects (each with "id", "name", "personality_traits", "initial_dialogue").
    - "new_items_found": An optional array of new item strings found in the scene.
    - "new_quests_triggered": An optional array of new quest objects (each with "id", "description", "objectives", "rewards", "status": "active").
    - "stat_changes": An optional object with keys like "health", "mana", "inventory_add", "inventory_remove", etc.
    """

    if context_type == "initial_scene":
        return f"""
        {base_prompt}
        The adventure begins. You wake up in a mysterious forest with no memory of how you got there.
        Generate the initial scene.
        """
    elif context_type == "next_turn":
        return f"""
        {base_prompt}
        The player has chosen to: "{player_input}".
        Continue the story, describe the consequences of their action, and provide new choices.
        Consider the hidden world parameters implicitly: {current_game_state["secret_world_parameters"]}.
        """
    elif context_type == "npc_dialogue" and npc_id:
        npc_data = current_game_state["npcs_data"].get(npc_id, {})
        npc_name = npc_data.get("name", "Unknown NPC")
        npc_traits = npc_data.get("personality_traits", "neutral")
        return f"""
        {base_prompt}
        The player is interacting with {npc_name} (Personality: {npc_traits}).
        The player said/chose: "{player_input}".
        Generate {npc_name}'s response, reflecting their personality and advancing any relevant plot or quest lines.
        Provide follow-up choices for dialogue or actions.
        """
    elif context_type == "quest_trigger":
        return f"""
        {base_prompt}
        The player's action has triggered a potential quest opportunity.
        Generate a narrative segment that introduces a new side quest relevant to "{player_input}".
        Include the quest's initial objectives.
        """
    else:
        return f"{base_prompt}\nPlayer's action: \"{player_input}\". Continue the narrative."

def make_ai_call(prompt: str) -> Dict[str, Any]:
    """
    Conceptual function to make a call to the Gemini API.
    In a real application, this would use a library like 'requests' in Python
    to send a POST request to the actual Gemini API endpoint.
    For this example, we'll simulate a response or note how it would be used.

    Args:
        prompt: The text prompt to send to the AI.

    Returns:
        A dictionary representing the parsed JSON response from the AI.
    """
    # Placeholder for actual API key
    API_KEY = "" # Your Gemini API Key would go here if running in a real environment.

    # This is a conceptual representation. In a real Python app, you'd use the 'requests' library.
    # Example using requests (requires 'requests' library installed: pip install requests):
    # import requests
    # url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"
    # headers = {'Content-Type': 'application/json'}
    # payload = {'contents': [{'role': 'user', 'parts': [{'text': prompt}]}]}
    # response = requests.post(url, headers=headers, json=payload)
    # response.raise_for_status() # Raise an exception for HTTP errors
    # result = response.json()
    # return json.loads(result['candidates'][0]['content']['parts'][0]['text'])

    # --- Simulated AI Response for demonstration ---
    print("\n--- Simulating AI Call ---")
    print(f"Prompt sent to AI:\n{prompt[:300]}...") # Print first 300 chars of prompt
    print("--- End Simulated AI Call ---")

    # Example of a structured JSON response the AI might return
    mock_responses = [
        {
            "scene_description": "The dense forest path opens into a moonlit clearing. In the center, an ancient, gnarled oak stands silent and imposing. Strange symbols glow faintly on its bark.",
            "available_choices": [
                "Examine the symbols on the tree.",
                "Search the clearing for anything useful.",
                "Try to find another path deeper into the forest."
            ],
            "new_npcs_introduced": [],
            "new_items_found": [],
            "new_quests_triggered": [],
            "stat_changes": {}
        },
        {
            "scene_description": "You carefully trace the glowing symbols on the ancient oak. They pulse with a faint energy. As your fingers brush against them, a small, intricate wooden key falls from a knot in the bark.",
            "available_choices": [
                "Pick up the wooden key.",
                "Leave the key and investigate the tree further.",
                "Head back to the forest path."
            ],
            "new_npcs_introduced": [],
            "new_items_found": ["Wooden Key"],
            "new_quests_triggered": [],
            "stat_changes": {"inventory_add": ["Wooden Key"]}
        },
        {
            "scene_description": "As you pick up the wooden key, a shimmering, ethereal pixie appears before you, fluttering its translucent wings. 'A keen eye, traveler!' it chirps, 'But a journey awaits. My stolen enchanted acorn must be recovered from the Gloomfang Spider's lair!'",
            "available_choices": [
                "Ask about the enchanted acorn.",
                "Inquire about the Gloomfang Spider.",
                "Politely decline and leave the clearing."
            ],
            "new_npcs_introduced": [
                {"id": str(uuid.uuid4()), "name": "Flicker (Pixie)", "personality_traits": ["flighty", "energetic", "desperate"], "initial_dialogue": "You found the key! Now help me!"}
            ],
            "new_items_found": [],
            "new_quests_triggered": [
                {
                    "id": str(uuid.uuid4()),
                    "description": "Flicker's Stolen Acorn",
                    "objectives": ["Retrieve the Enchanted Acorn from the Gloomfang Spider's Lair."],
                    "rewards": ["Pixie Dust", "Knowledge of Ancient Lore"],
                    "status": "active"
                }
            ],
            "stat_changes": {}
        }
    ]

    # Simple logic to return different mock responses based on context or history
    if "ancient oak" in prompt and "Examine the symbols" in prompt:
        return mock_responses[1]
    elif "Wooden Key" in prompt and "Pick up the wooden key" in prompt:
        return mock_responses[2]
    else:
        return mock_responses[0] # Default initial response

def _parse_ai_response(raw_ai_text: str) -> Dict[str, Any]:
    """
    Parses the raw text response from the AI (expected to be JSON).

    Args:
        raw_ai_text: The raw text string received from the AI.

    Returns:
        A dictionary containing the parsed game data.
    """
    try:
        # The AI is instructed to return JSON, so we attempt to parse it.
        parsed_data = json.loads(raw_ai_text)
        return parsed_data
    except json.JSONDecodeError as e:
        print(f"Error parsing AI response JSON: {e}")
        print(f"Raw AI response: {raw_ai_text}")
        # Return a default/error response if parsing fails
        return {
            "scene_description": "The world seems to glitch. A strange error occurred in the narrative. Please try a different action.",
            "available_choices": ["Try again.", "Look around cautiously."],
            "new_npcs_introduced": [], "new_items_found": [],
            "new_quests_triggered": [], "stat_changes": {}
        }

def _update_game_state_from_ai_response(
    current_game_state: Dict[str, Any],
    ai_response_data: Dict[str, Any]
) -> None:
    """
    Updates the main game_state dictionary based on the parsed AI response.

    Args:
        current_game_state: The current state of the game (will be modified in place).
        ai_response_data: The dictionary containing parsed data from the AI.
    """
    current_game_state["current_scene"]["description"] = ai_response_data.get("scene_description", "")
    current_game_state["current_scene"]["available_choices"] = ai_response_data.get("available_choices", [])

    # Add new NPCs
    for npc_data in ai_response_data.get("new_npcs_introduced", []):
        npc_id = npc_data.get("id", str(uuid.uuid4()))
        current_game_state["npcs_data"][npc_id] = {
            "name": npc_data.get("name", "Unnamed NPC"),
            "personality_traits": npc_data.get("personality_traits", []),
            "current_dialogue_state": npc_data.get("initial_dialogue", "Greetings."),
            "relevant_quests": [] # Can be updated later
        }
        current_game_state["current_scene"]["npcs_present"].append(npc_id)

    # Add new items
    for item in ai_response_data.get("new_items_found", []):
        if item not in current_game_state["current_scene"]["items_present"]:
            current_game_state["current_scene"]["items_present"].append(item)

    # Trigger new quests
    for quest_data in ai_response_data.get("new_quests_triggered", []):
        quest_id = quest_data.get("id", str(uuid.uuid4()))
        current_game_state["quests_data"][quest_id] = {
            "description": quest_data.get("description", "A new quest."),
            "status": quest_data.get("status", "active"),
            "objectives": quest_data.get("objectives", []),
            "rewards": quest_data.get("rewards", []),
        }
        current_game_state["current_scene"]["active_quests"].append(quest_id) # Link to scene

    # Apply stat changes
    stat_changes = ai_response_data.get("stat_changes", {})
    if "health" in stat_changes:
        current_game_state["player_state"]["health"] += stat_changes["health"]
    if "mana" in stat_changes:
        current_game_state["player_state"]["mana"] += stat_changes["mana"]
    if "inventory_add" in stat_changes:
        for item in stat_changes["inventory_add"]:
            if item not in current_game_state["player_state"]["inventory"]:
                current_game_state["player_state"]["inventory"].append(item)
    if "inventory_remove" in stat_changes:
        for item in stat_changes["inventory_remove"]:
            if item in current_game_state["player_state"]["inventory"]:
                current_game_state["player_state"]["inventory"].remove(item)

    # Update narrative history with the new scene description
    current_game_state["narrative_history"].append(current_game_state["current_scene"]["description"])
    print("Game state updated.")


# --- 3. Core Game Functions ---

def initialize_game() -> None:
    """
    Initializes the game state and generates the first scene using AI.
    """
    print("Initializing game...")
    global game_state # Modify the global game_state

    # Reset game state for new game (if called multiple times)
    game_state["player_state"] = {
        "inventory": [], "health": 100, "mana": 50,
        "location_history": [], "reputation": {}
    }
    game_state["narrative_history"] = []
    game_state["npcs_data"] = {}
    game_state["quests_data"] = {}

    initial_prompt = _construct_ai_prompt(game_state, "", "initial_scene")
    ai_response = make_ai_call(initial_prompt) # This would be a real API call
    parsed_data = _parse_ai_response(json.dumps(ai_response)) # Simulate parsing JSON from AI response

    _update_game_state_from_ai_response(game_state, parsed_data)
    game_state["player_state"]["location_history"].append(game_state["current_scene"]["description"])
    print("Game initialized successfully.")


def advance_story(player_choice: str) -> None:
    """
    Processes the player's choice and advances the story using AI.

    Args:
        player_choice: The choice made by the player.
    """
    print(f"\nPlayer chose: '{player_choice}'")

    # Add player's choice to narrative history for context
    game_state["narrative_history"].append(f"Player chooses: {player_choice}")
    game_state["player_state"]["location_history"].append(player_choice) # Track path

    # Construct prompt for the next turn
    next_turn_prompt = _construct_ai_prompt(game_state, player_choice, "next_turn")
    ai_response = make_ai_call(next_turn_prompt)
    parsed_data = _parse_ai_response(json.dumps(ai_response))

    _update_game_state_from_ai_response(game_state, parsed_data)
    game_state["player_state"]["location_history"].append(game_state["current_scene"]["description"])
    print("Story advanced.")


def handle_npc_interaction(npc_id: str, player_query: str) -> None:
    """
    Manages interaction with a specific NPC using AI.

    Args:
        npc_id: The ID of the NPC being interacted with.
        player_query: What the player says or asks the NPC.
    """
    if npc_id not in game_state["npcs_data"]:
        print(f"Error: NPC with ID {npc_id} not found.")
        return

    print(f"\nInteracting with {game_state['npcs_data'][npc_id]['name']}: Player asks '{player_query}'")

    # Construct prompt for NPC dialogue
    npc_dialogue_prompt = _construct_ai_prompt(game_state, player_query, "npc_dialogue", npc_id)
    ai_response = make_ai_call(npc_dialogue_prompt)
    parsed_data = _parse_ai_response(json.dumps(ai_response))

    # NPC responses might also update the scene or trigger quests/items
    _update_game_state_from_ai_response(game_state, parsed_data)

    # Special handling for NPC dialogue (AI will put response in scene_description)
    print(f"{game_state['npcs_data'][npc_id]['name']} replies: {game_state['current_scene']['description']}")


def display_current_scene() -> None:
    """
    Prints the current scene's description and available choices to the console.
    """
    print("\n" + "="*50)
    print("CURRENT SCENE:")
    print(game_state["current_scene"]["description"])
    print("\nAvailable Choices:")
    for i, choice in enumerate(game_state["current_scene"]["available_choices"]):
        print(f"  {i+1}. {choice}")
    print("\nPLAYER STATUS:")
    print(f"  Health: {game_state['player_state']['health']}")
    print(f"  Inventory: {', '.join(game_state['player_state']['inventory']) or 'Empty'}")
    print("\nACTIVE QUESTS:")
    if game_state["current_scene"]["active_quests"]:
        for q_id in game_state["current_scene"]["active_quests"]:
            quest = game_state["quests_data"].get(q_id)
            if quest:
                print(f"  - {quest['description']} (Status: {quest['status']})")
    else:
        print("  No active quests.")
    print("="*50)


# --- Example Game Loop (for testing these functions) ---
if __name__ == "__main__":
    print("Welcome to the AI Storyteller Adventure!")

    # 1. Initialize the game
    initialize_game()
    display_current_scene()

    # 2. Simulate a few turns
    while True:
        try:
            choice_input = input("Enter your choice number or type a custom action (e.g., '1', 'talk to guard', 'quit'): ").strip()
            if choice_input.lower() == 'quit':
                print("Thanks for playing!")
                break

            if choice_input.isdigit():
                choice_index = int(choice_input) - 1
                choices = game_state["current_scene"]["available_choices"]
                if 0 <= choice_index < len(choices):
                    player_action = choices[choice_index]
                else:
                    print("Invalid choice number. Please try again.")
                    continue
            else:
                player_action = choice_input # Custom action

            # Check for specific interaction types
            if player_action.lower().startswith("talk to "):
                target_npc_name = player_action[len("talk to "):].strip()
                found_npc_id = None
                for npc_id, npc_data in game_state["npcs_data"].items():
                    if npc_data["name"].lower() == target_npc_name.lower():
                        found_npc_id = npc_id
                        break
                if found_npc_id:
                    dialogue_query = input(f"What do you say to {game_state['npcs_data'][found_npc_id]['name']}? ")
                    handle_npc_interaction(found_npc_id, dialogue_query)
                else:
                    print(f"No NPC named '{target_npc_name}' found in this scene.")
                    advance_story(player_action) # Still advance story even if NPC not found
            else:
                advance_story(player_action)

            display_current_scene()

            # Simple game over condition (e.g., health reaches 0)
            if game_state["player_state"]["health"] <= 0:
                print("\nYour journey ends here. Game Over!")
                break

        except Exception as e:
            print(f"An error occurred: {e}")
            break
