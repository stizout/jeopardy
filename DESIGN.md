# Design System — The Den

Working title. Rename anytime. The product is the room, not the wordmark.

## Product Context

- **What this is:** A living-room Jeopardy board. 60s/70s clues for the grown-ups, kid-culture clues for the 12-year-olds. One shared TV. Every player’s phone is a buzzer.
- **Who it’s for:** Seniors who lived the 60s and 70s, and kids around 12 who can take PIXEL and BACKPACK. They play on the same team.
- **Space/industry:** Family party game. Peers: Jackbox (join), Kahoot (PIN), Factile (classroom Jeopardy). None of those are this product.
- **Project type:** Web app. Host screen on a laptop/TV. Player screens on phones. No native app. No accounts.

## Memorable thing

Kids and grandparents were actually playing together.

That means mixed-age teams and many buzzers, not a shared phone, and not kids-vs-seniors.

## How people connect

1. Someone starts a room. Two windows stay open: host on the laptop (answer panel always visible), board on the TV.
2. The TV lobby shows a huge 4-letter code (never 0, O, 1, I, L) and a QR.
3. Kids scan. Seniors hear the four letters and type them. Same site. No app. No account.
4. Each person enters only their own name. One phone, one person.
5. When the room is in, host taps **We’re all here**.
6. The room assigns each other: tap a name onto a team, from the TV or from any phone. Host can fix a wrong tap.
7. TV copy: “Mix a kid and a grown-up. Any phone on the team can buzz.” Nudge, not a lock. Same-age teams are allowed.
8. Host taps **Start the board**.

Short URL on the TV: `jeopardy-rg3b.onrender.com`. Kids scan the QR. Seniors hear the four letters.

Routes (intent, not final framework):

- `/` — Start a game or join
- `/host/:code` — laptop, always up: answer panel, scoring
- `/board/:code` — TV, always up: lobby, then the 6×5 board and the question
- `/play/:code` — phone after QR or typed code

Host stays on the computer. The TV never sees an unrevealed answer. Players never navigate the board from a phone.

## Play rules the UI must make obvious

- Clues live on the TV. Answers stay on the host laptop until the host reveals. Phones never show the clue or the board during play.
- When buzzers open, every phone on every team is a live button.
- First server-timestamped press locks that **team**, not that person. Teammate phones go to “Your team has the floor.” Other teams wait.
- Answers are spoken in the room. No typing on the phone.
- Host on the laptop taps Correct, Wrong (reopen other teams), Reveal, or Skip. The TV never shows those buttons.
- Same name + same code reconnects a dropped phone. Do not reset them like Kahoot.
- Late join is allowed until the host starts the board. After that, host can still seat someone between clues.

## Aesthetic Direction

- **Direction:** 80s game-show living room
- **Decoration level:** intentional — beveled blue tiles, faint grain, brass edges. Not 70s wallpaper. Not flat SaaS.
- **Mood:** The board reads as Jeopardy from the couch. The chrome around it reads as the den, not a studio.
- **Reference:** Real Jeopardy board language (6×5, gold money, blue tiles). Jackbox join (4 letters, no app). Not Kahoot candy. Not Factile classroom chrome.

## Typography

- **Display/Hero:** Cabinet Grotesk — categories, dollar values, room code, team names. Condensed enough to fill a tile. Not a Helvetica/Swiss 911 costume.
- **Body / clues:** Fraunces — clue text, readable from a sofa. Period warmth without cloning ITC Korinna.
- **UI/Labels:** Instrument Sans — phone chrome, host buttons, captions. Clear at arm’s length.
- **Data/Tables:** Cabinet Grotesk with tabular-nums for money and scores.
- **Code:** unused in the product UI.
- **Loading:** Cabinet Grotesk from Fontshare. Fraunces and Instrument Sans from Google Fonts (or Bunny).
- **Scale:**
  - Room code: 72–128px
  - Board values: 28px desktop, never smaller than 16px
  - Category labels: 13–16px, all caps, tracking tight
  - Clue: 28–44px
  - Phone name / buzzer label: 22–28px
  - UI label: 12–14px, 0.14–0.2em tracking

## Color

- **Approach:** balanced — board blue and gold do the Jeopardy job; brass and cream do the den; team colors do identity.
- **Board:** `#0A1A8C` — duskier than broadcast `#060CE9` so TVs do not bloom. Deep cell `#06125F` for spent tiles.
- **Gold:** `#F4C430` — money, room code, correct flash.
- **Stage:** `#0C0A08` — page and phone chrome.
- **Stage raised:** `#16110C`
- **Brass:** `#C4A46A` — wordmark, hints, edges.
- **Cream:** `#F6F0E4` — primary text on dark.
- **Cream dim:** `#C9C0B0`
- **Buzzer red:** `#C81D25` — default slam button if a team color is not yet assigned.
- **Wrong:** `#8B1E1E`
- **Team teal:** `#1FB8A8`
- **Team amber:** `#E39B2B`
- **Team rose:** `#E25B7A`
- **Team lime:** `#A6C84B`
- **Correct:** gold flash, not traffic-light green.
- **Dark mode:** the product is dark. Light is only for the specimen / docs toggle.

## Spacing

- **Base unit:** 8px
- **Density:** spacious on TV (read from the sofa). Phone is almost empty except a 44px+ target. Buzzer is ~220px.
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout

- **Approach:** grid-disciplined on the board (it is a 6×5 grid). Lobby is a poster: code first, QR second, names as chips.
- **Team-up:** as many team columns as the host adds (default 2, up to 12), plus a “not yet” pile. Names are large chips. Tap name, tap team.
- **Scoreboard:** team color bar, team name, money, member names underneath (`Dot · Maya`).
- **Phone:** one job per screen. Join code, name, pick teammates, wait, buzz, floor.
- **Max content width:** TV uses the full viewport. Specimen docs max 1180px.
- **Border radius:** tiles 0–2px (board is a grid). Phone chrome 8px. Phone device frame 36px. Buzzer is a circle.
- **Touch:** 44px minimum. Room-code keys and name chips bigger.

## Motion

- **Approach:** intentional
- **Tile:** flip or fade to the clue. Spent tile drops to deep blue.
- **Buzz:** lock the winning team immediately. Other phones dim.
- **Score:** tick the number. No confetti.
- **Team-up:** name chip slides into the column.
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50–100ms) short(150–250ms) medium(250–400ms) long(400–700ms). Buzz lock is short. Tile flip is medium.

## Screens

| Screen | Device | Job |
| --- | --- | --- |
| Start | either | Start a game / Join a game |
| Host | laptop | Always-on answer panel + score |
| Lobby | TV | Code, QR, arriving names, We’re all here |
| Join | phone | Type 4 letters or land from QR |
| Name | phone | One field |
| Team-up | TV + phones | Assign people to teams (host can fix) |
| Board | TV | 6×5, scores by team |
| Clue | TV | Category, value, clue, buzzers-open |
| Buzzer | phone | Team-colored button |
| Floor | phone | Your team is answering |
| Waiting | phone | Other team is answering |
| Host clue | laptop | Giant answer + Correct / Wrong-reopen / Reveal / Skip |

## Anti-patterns

- Do not put the board or the clue on the phone during play.
- Do not put the answer on the TV until the host reveals it.
- Do not make people share a phone.
- Do not use a 6–10 digit Kahoot PIN. Four letters.
- Do not require an account or an app.
- Do not default to Kids vs Seniors in copy or empty-state art.
- Do not use Inter, Roboto, purple gradients, or confetti.

## Decisions Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-09-22 | Initial system | /design-consultation. Memory: playing together. Research: Jackbox, Kahoot, Factile, JeopardyLabs. |
| 2026-09-22 | Everyone gets a buzzer, then teams | Seniors lose a raw buzz race. A shared phone hands the button to the kid. Mixed team + any-teammate buzz is the unit: kid thumb, grandparent memory. |
| 2026-09-22 | Spoken answers only | Typing splits the pair. Host hears the room. |
| 2026-09-22 | Working title The Den | Easy to rename. Not locked as a brand. |
| 2026-09-22 | Any number of teams | Host adds or removes columns. Default two. Max twelve. |
| 2026-09-22 | Host laptop vs TV board | Answer stays on the computer. TV shows the question. |
| 2026-09-23 | No 80s; add kid pack | 80s clues cut. PIXEL + BACKPACK are 12-year-old culture. Vinyl/Moon/Sitcoms/Wheels stay 60s/70s. Easy $200, harder $1000. |
