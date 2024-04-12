import os
import json

def get_games(path, prefix='cine'): 
    archive = os.listdir(archive_path)
    filenames = [archive_path + p for p in archive if p.endswith('json')]

    files = sorted(f for f in os.listdir() if f.startswith(prefix))

    games = []
    for filename in filenames:
        print(filename)
        with open(filename, 'r') as f:
            games.append(json.loads(f.read()))
    return games

# games = get_games(path) (i.e. "/Users/your-name/Downloads")

# {g['result'] for g in games}
# >>> ('BATTLE DRAW', 'BATTLE LOST', '🏆 BATTLE WON')

# Basic Stats
wins   = [game for game in games if game['result'].endswith('WON')]
losses = [game for game in games if game['result'].endswith('LOST')]
draws  = [game for game in games if game['result'].endswith('DRAW')]
print(f"W/L/D: {len(wins)}/{len(losses)}/{len(draws)}")

# List of skipped movies
my_skips =  [game['your_skip'] for game in games if game.get('your_skip')]
opp_skips = [game['opponent_skip'] for game in games if game.get('opponent_skip')]

# List of killshots
win_movies =  [g.get('last_movie') for g in wins]
loss_movies = [g.get('last_movie') for g in losses]

# Movies (excluding first pre-selected movie)
movies     = sum([[movie['name'] for movie in game['movies'][:-1] if not movie['skip']] for game in games], [])
my_movies  = sum([[movie['name'] for movie in game['movies'][:-1] if not movie['skip'] and movie['turn'] % 2 == game['your_parity']] for game in games], [])
opp_movies = sum([[movie['name'] for movie in game['movies'][:-1] if not movie['skip'] and movie['turn'] % 2 != game['your_parity']] for game in games], [])


# Top most played movies
from collections import Counter
most_played = Counter(my_movies).most_common()
print(', '.join(f"{movie} ({ct})" for movie, ct in most_played))

# Top years
most_common_years = Counter([int(movie.split(" ")[-1][1:-1]) for movie in set(my_movies)]).most_common()
print(', '.join([f"{y} ({n})" for y, n in most_common_years]))

# Top decades
most_common_decades = Counter([int(movie.split(" ")[-1][1:-2]) for movie in set(my_movies)]).most_common()
print(', '.join([f"{y}0 ({n})" for y, n in most_common_decades]))
