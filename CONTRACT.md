# Pokemon Word Search - CONTRACT v1.0

## 1. Core Gameplay

- Each round contains exactly 5 random Pokemon from Generation 1.
- Only Generation 1 Pokemon (National Dex #1-151) are used.
- Each selected Pokemon appears exactly once in the puzzle.
- The puzzle is a word search grid containing all 5 selected Pokemon names.
- Empty grid spaces are filled with random letters.
- The round is complete when all 5 Pokemon have been found.

### Word Placement Rules

- Pokemon names may be placed horizontally, vertically, or diagonally.
- Names may appear forwards or backwards.
- Words may overlap only when overlapping letters are identical.
- All 5 selected Pokemon must be successfully placed before the round begins.
- If puzzle generation fails, the board must regenerate until a valid puzzle is created.

### Name Normalization Rules

- All names are converted to uppercase.
- Spaces are removed.
- Punctuation is removed.
- Special characters are normalized to simple letter equivalents.

Examples:
- Farfetch'd -> FARFETCHD
- Mr. Mime -> MRMIME
- Nidoran♀ -> NIDORANF
- Nidoran♂ -> NIDORANM

The displayed Pokemon name still uses proper in-game formatting.

## 2. Grid System

- The puzzle grid is square.
- The puzzle grid is 10 x 10.
- Grid size remains consistent within a round.
- Every cell displays exactly one letter.
- The grid is fully populated before the round starts.

### Selection Behavior

- The player can select letters in a straight line only.
- Valid selections follow one continuous direction.
- Selection may be made in either direction along a valid placed word.
- Invalid selections do not count as found words.

### Found Word Behavior

When a valid Pokemon is found:

- The selected word is marked as found in the grid.
- That Pokemon cannot be found again.
- The Pokemon sprite appears in the reveal area.
- The Pokemon cry plays.
- Any previously playing cry stops before a new cry begins.
- The counter updates immediately.

## 3. Counter System

- Counter displays as `X / 5`.
- `X` is the number of Pokemon found in the current round.
- The counter updates immediately when a Pokemon is found.
- The counter resets to `0 / 5` on a new round or reset.

## 4. Found Pokemon Display

- A reveal area appears below the board.
- It shows 5 placeholder slots by default.
- Found Pokemon remain hidden until discovered.
- Each found Pokemon replaces one placeholder with its sprite.
- Found Pokemon remain visible for the duration of the round.

## 5. Audio System

### Pokemon Cries

- A Pokemon cry plays only when that Pokemon is found.
- A Menu toggle can mute Pokemon cries without muting music.
- Only one cry may play at a time.

### Background Music

- The app uses the same background music track as the Pokemon Memory Game.
- Background music is ON by default unless muted.
- Background music starts only after first user interaction.
- Background music loops during gameplay.
- A Menu toggle can mute music without muting cries.

## 6. Menu

- The app includes a Menu.
- The Menu blocks background interaction while open.
- Menu contents: Rounds Completed counter, Mute cries toggle, Mute music toggle, New Round, Reset.

### Rounds Completed Counter

- Displays the total number of completed rounds.
- Increments by 1 each time a round is fully completed.
- Persists across sessions.

## 7. Round Completion

- A round is complete when all 5 Pokemon have been found.
- Completion is recognized immediately after the 5th correct find.
- The Rounds Completed counter increments by 1.
- A completion dialog is shown.
- Completion celebration audio plays once.
- The dialog shows the updated Rounds Completed total.
- The dialog includes a Next Round button.

## 8. New Round System

- New Round generates 5 new random Gen 1 Pokemon, a new valid grid, an empty reveal list, and a reset counter of `0 / 5`.

## 9. Reset System

- Reset keeps the same 5 Pokemon and same generated grid.
- All found progress is cleared.
- Reveal slots reset to empty.
- The counter resets to `0 / 5`.
- Audio settings persist.
- Rounds Completed is not affected.

## 10. Auto-Save / Persistence

- The app persists the current round, found progress, counter progress, rounds completed, and audio preferences across refresh.
- Temporary drag state and open menu/modal state do not persist.

## 11. Data Requirements

Each Pokemon used by the app supports:

- National Dex ID
- Display name
- Normalized search name
- Sprite asset
- Cry asset

## 12. UI Integrity Rules

- No broken grid generation.
- No broken sprite rendering.
- No broken audio playback due to repeated finds.
- Invalid selections do not count as found words.
- Found words cannot be discovered more than once.
- The puzzle remains playable after refresh, reset, and new round generation.
