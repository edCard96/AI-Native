# cine_mind_game.py

import random
import difflib # For potential fuzzy matching in guesses

# --- 1. Movie Selection Function ---
def select_secret_movie(difficulty='medium', genre_preference=None, min_year=1950, max_year=2025):
    """
    Randomly selects a movie based on criteria and compiles its details.

    Args:
        difficulty (str, optional): 'easy', 'medium', 'hard'. Influences movie obscurity. Defaults to 'medium'.
        genre_preference (str, optional): Preferred genre (e.g., 'sci-fi'). Defaults to None.
        min_year (int, optional): Earliest release year to consider. Defaults to 1950.
        max_year (int, optional): Latest release year to consider. Defaults to 2025.

    Returns:
        dict: A dictionary with movie details, or None if no suitable movie is found.
              Keys: 'title', 'genres', 'actors', 'director', 'release_year',
                    'plot_summary', 'themes', 'is_animated', 'has_sequel', 'content_rating'.
    """
    # Placeholder for a simulated movie database.
    # In a real application, this would fetch from a database or API.
    movie_db = [
        {
            'title': 'The Matrix',
            'genres': ['Sci-Fi', 'Action'],
            'actors': ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'],
            'director': 'The Wachowskis',
            'release_year': 1999,
            'plot_summary': 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
            'themes': ['artificial intelligence', 'reality vs illusion', 'hero\'s journey'],
            'is_animated': False,
            'has_sequel': True,
            'content_rating': 'R'
        },
        {
            'title': 'Forrest Gump',
            'genres': ['Drama', 'Romance', 'Comedy'],
            'actors': ['Tom Hanks', 'Robin Wright', 'Gary Sinise'],
            'director': 'Robert Zemeckis',
            'release_year': 1994,
            'plot_summary': 'The presidencies of Kennedy and Johnson, the Vietnam War, Watergate, and other historical events unfold from the perspective of an Alabama man with an IQ of 75.',
            'themes': ['destiny', 'innocence', 'American history'],
            'is_animated': False,
            'has_sequel': False,
            'content_rating': 'PG-13'
        },
        {
            'title': 'Spirited Away',
            'genres': ['Animation', 'Fantasy', 'Adventure'],
            'actors': ['Rumi Hiiragi', 'Miyu Irino'], # Japanese VAs, for example
            'director': 'Hayao Miyazaki',
            'release_year': 2001,
            'plot_summary': 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.',
            'themes': ['childhood', 'courage', 'environmentalism'],
            'is_animated': True,
            'has_sequel': False,
            'content_rating': 'PG'
        },
        {
            'title': 'Inception',
            'genres': ['Sci-Fi', 'Action', 'Thriller'],
            'actors': ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
            'director': 'Christopher Nolan',
            'release_year': 2010,
            'plot_summary': 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
            'themes': ['dreams', 'reality', 'subconscious'],
            'is_animated': False,
            'has_sequel': False,
            'content_rating': 'PG-13'
        },
        {
            'title': 'The Shawshank Redemption',
            'genres': ['Drama'],
            'actors': ['Tim Robbins', 'Morgan Freeman'],
            'director': 'Frank Darabont',
            'release_year': 1994,
            'plot_summary': 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
            'themes': ['hope', 'freedom', 'justice'],
            'is_animated': False,
            'has_sequel': False,
            'content_rating': 'R'
        },
         {
            'title': 'Toy Story',
            'genres': ['Animation', 'Adventure', 'Comedy', 'Family'],
            'actors': ['Tom Hanks', 'Tim Allen'],
            'director': 'John Lasseter',
            'release_year': 1995,
            'plot_summary': 'A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy\'s room.',
            'themes': ['friendship', 'loyalty', 'growing up'],
            'is_animated': True,
            'has_sequel': True,
            'content_rating': 'G'
        },
    ]

    # Filter movies based on year
    filtered_movies = [
        m for m in movie_db
        if min_year <= m['release_year'] <= max_year
    ]

    # Filter based on genre preference
    if genre_preference:
        genre_filtered = [
            m for m in filtered_movies
            if genre_preference.lower() in [g.lower() for g in m['genres']]
        ]
        if genre_filtered: # Use genre-filtered list if not empty
            filtered_movies = genre_filtered
        else: # If genre preference yields no results, fall back to all year-filtered movies
            print(f"Warning: No movies found for genre '{genre_preference}'. Selecting from all available.")

    # Difficulty could influence selection logic here (e.g., pick more obscure for 'hard')
    # For now, it just randomly selects from the filtered list.
    if not filtered_movies:
        return None # No movies match criteria

    return random.choice(filtered_movies)

# --- 2. Question Answering Function ---
def answer_player_question(question, secret_movie_data):
    """
    Analyzes a player's question and determines an appropriate answer based on secret_movie_data.

    Args:
        question (str): The question asked by the player.
        secret_movie_data (dict): Comprehensive information about the secret movie.

    Returns:
        str: The AI's answer (e.g., "Yes.", "No.", "It features elements...", "I'm sorry...").
    """
    q_lower = question.lower()

    # --- Genre questions ---
    for genre in secret_movie_data['genres']:
        if genre.lower() in q_lower:
            return f"Yes, it is a {genre} movie."

    # --- Actor/Director questions ---
    if "star" in q_lower or "actor" in q_lower or "actress" in q_lower:
        for actor in secret_movie_data['actors']:
            if actor.lower() in q_lower or \
               difflib.SequenceMatcher(None, q_lower, actor.lower()).ratio() > 0.7: # Fuzzy match for actors
                return f"Yes, {actor} is in it."
        return "No, that actor is not a main character in the movie."
    elif "director" in q_lower or "directed by" in q_lower:
        if secret_movie_data['director'].lower() in q_lower or \
           difflib.SequenceMatcher(None, q_lower, secret_movie_data['director'].lower()).ratio() > 0.7:
            return f"Yes, it was directed by {secret_movie_data['director']}."
        return "No, that director did not direct this movie."

    # --- Release Year questions ---
    if "year" in q_lower or "released" in q_lower:
        current_year = 2025 # Assuming current year for "recent" checks
        movie_year = secret_movie_data['release_year']
        if "1990s" in q_lower or "90s" in q_lower:
            return "Yes." if 1990 <= movie_year <= 1999 else "No."
        elif "2000s" in q_lower or "00s" in q_lower:
            return "Yes." if 2000 <= movie_year <= 2009 else "No."
        elif "2010s" in q_lower or "10s" in q_lower:
            return "Yes." if 2010 <= movie_year <= 2019 else "No."
        elif "recent" in q_lower:
            return "Yes, it's a relatively recent movie." if current_year - movie_year <= 10 else "No, it's not a very recent movie."
        elif "old" in q_lower or "classic" in q_lower:
            return "Yes, it's an older film." if movie_year < 1980 else "No, it's not considered an old classic."
        elif str(movie_year) in q_lower:
            return f"Yes, it was released in {movie_year}."
        else:
            return f"It was released in {movie_year}."

    # --- Setting/Theme questions ---
    plot_lower = secret_movie_data['plot_summary'].lower()
    themes_lower = [t.lower() for t in secret_movie_data['themes']]

    if "space" in q_lower:
        return "Yes, it takes place partly in space." if "space" in plot_lower else "No, it is not set in space."
    if "city" in q_lower or "urban" in q_lower:
        return "Yes, a significant part of it is set in a city." if "city" in plot_lower or "urban" in plot_lower else "No, it is not primarily set in a city."
    if "time travel" in q_lower:
        return "Yes, time travel is a central theme." if "time travel" in themes_lower else "No, it doesn't involve time travel."
    if "heist" in q_lower or "steal" in q_lower:
        return "Yes, a heist or a form of stealing is part of the plot." if "heist" in themes_lower or "steal" in plot_lower else "No, it doesn't involve a heist."
    if "robot" in q_lower or "ai" in q_lower or "artificial intelligence" in q_lower:
        return "Yes, artificial intelligence plays a role." if "artificial intelligence" in themes_lower or "robot" in plot_lower or "ai" in plot_lower else "No, robots or AI are not central."


    # --- Boolean properties ---
    if "animated" in q_lower:
        return "Yes, it's an animated movie." if secret_movie_data['is_animated'] else "No, it's a live-action movie."
    if "sequel" in q_lower or "series" in q_lower or "franchise" in q_lower:
        return "Yes, it has at least one sequel." if secret_movie_data['has_sequel'] else "No, it does not have a sequel."

    # --- Nuance for "Partially/Sometimes" ---
    if "sad" in q_lower or "depressing" in q_lower:
        if "drama" in themes_lower or "tragedy" in themes_lower:
            if "comedy" in themes_lower or "hope" in themes_lower:
                return "It explores some dramatic or sad themes, but also has moments of hope or humor."
            return "Yes, it has significant sad or dramatic elements."
        return "No, it's not primarily a sad movie."
    
    if "funny" in q_lower or "comedy" in q_lower or "humorous" in q_lower:
        if "comedy" in themes_lower or "comedy" in [g.lower() for g in secret_movie_data['genres']]:
            return "Yes, it's a comedic film."
        elif "humor" in plot_lower and ("drama" in themes_lower or "action" in themes_lower):
            return "While not a pure comedy, it does contain humorous elements."
        return "No, it is not primarily a comedy."


    # --- Unclear/Irrelevant questions ---
    return "I'm sorry, I can't answer that based on the movie's information. Please try a different kind of question."

# --- 3. Game State Management Function ---
def update_game_state(current_state, player_input, is_guess):
    """
    Processes a player's input and updates the overall game state, determining win/loss.

    Args:
        current_state (dict): The current state of the game.
        player_input (str): The player's latest input (question or guess).
        is_guess (bool): True if player_input is a movie guess, False if it's a question.

    Returns:
        dict: The updated game state.
    """
    updated_state = current_state.copy()
    player_feedback = ""

    if not is_guess:
        updated_state['questions_asked_count'] += 1
        questions_left = updated_state['max_questions'] - updated_state['questions_asked_count']
        player_feedback = f"You have used {updated_state['questions_asked_count']} out of {updated_state['max_questions']} questions. {questions_left} questions left."
    else:
        # Fuzzy matching for guesses
        similarity = difflib.SequenceMatcher(None, player_input.lower(), updated_state['secret_movie_title'].lower()).ratio()
        
        # Consider a guess correct if similarity is high, e.g., > 0.85
        if similarity > 0.85 or player_input.lower() == updated_state['secret_movie_title'].lower():
            updated_state['game_over'] = True
            updated_state['win_condition'] = 'guessed'
            player_feedback = f"Congratulations! You guessed it! The movie was '{updated_state['secret_movie_title']}'!"
        else:
            player_feedback = f"That's a good guess, but not quite! The movie is not '{player_input}'. Try again!"

    # Check if questions ran out (only if game not already won)
    if not updated_state['game_over'] and updated_state['questions_asked_count'] >= updated_state['max_questions']:
        updated_state['game_over'] = True
        updated_state['win_condition'] = 'ran_out_of_questions'
        player_feedback = f"You've run out of questions! The movie was '{updated_state['secret_movie_title']}'. Better luck next time!"

    updated_state['current_message'] = player_feedback
    return updated_state

# --- 4. Game Initialization Function ---
def initialize_new_game(game_settings=None):
    """
    Sets up all necessary data and variables to start a fresh game of CineMind.

    Args:
        game_settings (dict, optional): Overall game configuration.
                                        Keys: 'max_questions', 'difficulty', 'preferred_genre', 'player_name'.

    Returns:
        tuple: (secret_movie_data, initial_game_state) or (None, None) if setup fails.
    """
    settings = {
        'max_questions': 21,
        'difficulty': 'medium',
        'preferred_genre': None,
        'player_name': 'Player',
    }
    if game_settings:
        settings.update(game_settings)

    secret_movie_data = select_secret_movie(
        difficulty=settings['difficulty'],
        genre_preference=settings['preferred_genre']
    )

    if secret_movie_data is None:
        initial_game_state = {
            'questions_asked_count': 0,
            'max_questions': settings['max_questions'],
            'secret_movie_title': 'N/A',
            'game_over': True, # Game is over if no movie can be selected
            'win_condition': 'setup_error',
            'current_message': "Error: Could not select a movie based on criteria. Please try different settings."
        }
        return None, initial_game_state

    initial_game_state = {
        'questions_asked_count': 0,
        'max_questions': settings['max_questions'],
        'secret_movie_title': secret_movie_data['title'],
        'game_over': False,
        'win_condition': None,
        'current_message': (
            f"Welcome, {settings['player_name']}! I've picked a secret movie. "
            f"You have {settings['max_questions']} questions to guess it. Ask away!"
        )
    }

    return secret_movie_data, initial_game_state

# --- 5. Display Game State Function ---
def display_game_status(game_state):
    """
    Presents current game information to the player.

    Args:
        game_state (dict): The current game state dictionary.
    """
    print("\n" + "="*40)
    print(f"       CineMind - Guess the Movie")
    print("="*40)

    if game_state['game_over']:
        print(game_state['current_message'])
        if game_state['win_condition'] == 'guessed':
            print(f"\n--- YOU WON! The movie was: {game_state['secret_movie_title']} ---")
        elif game_state['win_condition'] == 'ran_out_of_questions':
            print(f"\n--- GAME OVER! The movie was: {game_state['secret_movie_title']} ---")
        elif game_state['win_condition'] == 'setup_error':
            print("\n--- Game could not be started due to an error. ---")
    else:
        questions_left = game_state['max_questions'] - game_state['questions_asked_count']
        print(f"Questions left: {questions_left}/{game_state['max_questions']}")
        print(f"\nAI: {game_state['current_message']}")

    print("="*40 + "\n")

# --- 6. Get Player Input Function ---
def get_player_input():
    """
    Prompts the player for input and categorizes it as a question or guess.

    Returns:
        tuple: (player_text (str), is_guess (bool))
    """
    player_text = input("Your turn (Type 'Is it <Movie Title>?' to guess, or ask a question): ").strip()

    # Simple logic to determine if it's a guess
    guess_phrases = ["is it", "i think it's", "my guess is", "i guess it's"]
    is_guess = False
    if player_text.lower().startswith(tuple(guess_phrases)) or \
       (not player_text.endswith('?') and not any(player_text.lower().startswith(q) for q in ["who", "what", "where", "when", "why", "how", "can", "does", "is", "do"])):
        is_guess = True

    return player_text, is_guess

# --- 7. Main Game Loop Function ---
def play_cine_mind(initial_game_settings=None):
    """
    The main function that runs the entire CineMind game.
    """
    print("Starting a new CineMind game...")
    secret_movie_data, game_state = initialize_new_game(initial_game_settings)

    if secret_movie_data is None:
        display_game_status(game_state) # Display error message
        return # Exit if game couldn't be initialized

    while not game_state['game_over']:
        display_game_status(game_state)
        player_text, is_guess = get_player_input()

        if is_guess:
            # For a guess, the AI's "answer" is handled by update_game_state's feedback
            # No direct answer_player_question call needed for guesses
            game_state = update_game_state(game_state, player_text, is_guess=True)
        else:
            ai_answer = answer_player_question(player_text, secret_movie_data)
            game_state['current_message'] = f"AI: {ai_answer}" # Set AI's response as the current message
            game_state = update_game_state(game_state, player_text, is_guess=False) # Update state after a question


    # Final display after the game ends
    display_game_status(game_state)

    # Ask to play again
    while True:
        play_again = input("Do you want to play again? (yes/no): ").lower().strip()
        if play_again == 'yes':
            print("\n" * 3) # Add some spacing for a new game
            play_cine_mind(initial_game_settings) # Start a new game with same settings
            break # Break out of this loop after starting new game
        elif play_again == 'no':
            print("Thanks for playing CineMind! Goodbye!")
            break
        else:
            print("Invalid input. Please type 'yes' or 'no'.")


# --- Main execution block ---
if __name__ == "__main__":
    # You can customize initial settings here
    game_config = {
        'max_questions': 21,
        'difficulty': 'medium', # 'easy', 'medium', 'hard' (logic needs more refinement for 'hard')
        'preferred_genre': None, # e.g., 'Sci-Fi', 'Comedy', None
        'player_name': 'Movie Buff'
    }
    play_cine_mind(game_config)