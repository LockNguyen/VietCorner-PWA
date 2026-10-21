// The order the worship songs play in: every song once per round, in a random order (the user, 2026-10-21).
// Plain random could play the same song twice in a row; a round cannot, and the song that ended a round is
// kept away from the start of the next one.

// why: with six songs, at least two others play before a song comes back across a round's end.
const MIN_SONGS_BETWEEN = 2;

// Returns the songs in a random order (Fisher–Yates: every order equally likely).
function shuffled(songs: string[], random: () => number): string[] {
  const order = [...songs];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// The next round of every song. `justPlayed` is the song that ended the last round (null before the first):
// it goes at a random place no earlier than MIN_SONGS_BETWEEN, or last when there are too few songs.
// `random` is a parameter so the tests can fix it.
export function nextRound(songs: string[], justPlayed: string | null, random: () => number = Math.random): string[] {
  if (justPlayed === null || !songs.includes(justPlayed)) return shuffled(songs, random);
  const others = shuffled(
    songs.filter((song) => song !== justPlayed),
    random,
  );
  const earliest = Math.min(MIN_SONGS_BETWEEN, others.length);
  const at = earliest + Math.floor(random() * (others.length - earliest + 1));
  others.splice(at, 0, justPlayed);
  return others;
}
