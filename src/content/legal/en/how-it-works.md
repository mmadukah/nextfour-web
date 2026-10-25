---
title: How it works
meta: The rules behind the queue, the picks and the board on a NextFour club night.
---

This page sets out how NextFour decides who plays next, so organisers and players can check for themselves that a night is fair. It covers the queue, each way of picking, what the organiser can override, scores and ratings, the courtside board, and what happens when the signal drops.

Every live action (checking in, picking, finishing a game) is worked out and saved on our server in one step. Every phone and tablet in the hall then shows the same board, and two people can't put the same player on two courts at once.

## Checking in and arriving late

- **Ways to check in:** from your own phone with the session's check-in code, at a courtside tablet running the Session Board, or by the organiser or a deputy. Pro adds a QR code to scan and an NFC tag to tap.
- **Guests** without the app can be added by name, and keep their games and ratings if they later sign up and claim the profile.
- **The queue runs on waiting time.** Each player waits from the moment they checked in or the moment their last game ended, whichever is later. A late arrival therefore joins the back of the queue, level with anyone coming off court at that moment. There is no head start for arriving late and no penalty either.
- **Stepping away:** a player who takes a break stays checked in but can't be picked. Coming back puts them at the back of the queue. A break called while on court starts when that game ends.
- **Leaving:** checking out takes a player off the board, after their current game if they are on court. Stepping away or leaving also ends any pairing they were in.
- **One session at a time:** checking in to a session checks you out of any other live session first. It is refused if you are on court or already picked for a game there.

## The waiting queue

- Longest waiting first. On pegboard nights, players who came off the same game are ordered winners first, then a draw, then losers.
- Players who are away sit at the bottom and can't be picked.
- Two players paired by the organiser always sit next to each other.
- The order is worked out on the server and stored with every change, so every screen shows exactly the same queue.

## Ways of picking

The organiser chooses one of four for each session.

| Method | Who chooses the four | Plan |
|---|---|---|
| Pegboard | The player whose turn it is | Free |
| Manual | The organiser | Free |
| Skill-based | NextFour, automatically | Pro |
| King of the Court | Winners stay on; challengers come from the queue | Pro |

### Pegboard

The digital version of the club pegboard.

- **One player holds the pick.** When a court comes free, they get a nudge on their phone and choose three players to join them. The first player they choose is their partner.
- **Who they can choose:** the players waiting next in the queue. The organiser sets how far down the queue the picker can see (by default the next seven).
- **Picking ahead:** while every court is busy, the picker can still make their game. It waits in line and goes on the next free court, in order.
- **Passing the pick on:** after a pick, the pick moves to the next player in the queue who wasn't just picked and isn't away. If nobody is waiting, the pick goes to whoever has waited longest as soon as a game ends, a court is reset or a player comes back from a break.
- **Skipping a picker:** the organiser can skip someone who isn't ready. They stay second in the queue, so they don't lose their place.
- **Avoiding the same game twice:** if the four chosen have already played tonight on the same sides, the app says so and offers one tap to re-split them into the teams that have played together least. In our simulations, taking it every time cut exact repeats by 60 to 100%.
- **Smart pick:** one tap builds the most even game from the picker's list, using players' ratings. The picker can still change any of the three.
- **Ladies pick from anywhere** (optional): a lady's list also includes ladies further back who have been off court for at least five minutes, but only enough to make up the game she needs. With it on, Smart pick makes a ladies' game for a lady and a men's game for a man whenever the list has three more of each. In simulations of real club nights, this left the men's average wait within a minute of the usual.

### Skill-based

NextFour fills each free court automatically, in court order, from the players waiting.

**Fairness mode** (the organiser picks one):

- **Fair rotation:** the player who has waited longest is always in the next game. The other three come from within one round of courts of the queue (four players per court), so nobody is passed over by someone who wouldn't have played this round anyway.
- **Best match:** chooses the best game from near the front of the queue. Passing over a player at the front has a cost that grows with how long they've waited, and anyone who has waited 25 minutes goes in the next game whatever the ratings say.

**Goal** (the organiser picks one):

- **Even teams:** sides as close in rating as possible, so stronger and weaker players mix.
- **Similar levels:** four players close in rating to each other.

**Rules applied to every game:**

- Each four is seated on its most even two-against-two split.
- **Variety:** two players who shared one of their last two games count against a group, so the same four rarely go straight back on together. In our simulations of 5-court nights, that happened in at most 3% of games.
- **Pairs** are kept together and always on the same side. Pairing gives way when keeping a pair together would make a lopsided game or a rematch.
- **Gender policy:** off, Mixed (two men and two ladies, one of each a side) or Same-gender. Whatever the policy, a game of two men and two ladies is always seated one of each per side, never men against ladies. Nobody is put on court as the only one of their gender when another group was possible.

**Known costs:** choosing by skill means some players wait longer than they would in a plain first-come queue. On a 5-court night with 32 players, the longest wait is 17 to 22 minutes against 12 to 13 first-come. A player with nobody near their level gets fewer games. We publish these numbers rather than hide them.

### King of the Court

- Winners stay on court and take on challengers from the front of the queue. Court 1 is the King's Court. Losers go to the back of the queue.
- **Win cap:** after a set number of wins in a row (three by default, or no cap), the winners come off too, ahead of the losers in the queue.
- **Split winners** (on by default, doubles): the two winners split up, one per side, each with a new partner.
- **Timed rounds** (optional): every court plays and stops together on a central clock, with a buzzer on the board and the organiser's phone and a one-minute warning. Losers can go to the queue or move down a court (the ladder).
- **Nobody waits forever:** anyone who has waited 25 minutes is drawn next, whatever the gender policy wants.

### Manual

The organiser places every player. All the board's rules below still apply.

## What the organiser can override

The organiser and any deputies can, at any time:

- put any waiting player in any slot, take a player off a game, or move a player between slots;
- reset a game, skip the picker, and start, pause or resume a game's clock;
- check players in and out, mark them away or back, and add guests;
- pair two players so they play together (Pro);
- end the session early. Otherwise it ends on its own once it is past its finish time and the courts are idle.

The server refuses any change that would put a player on two games, place someone who isn't checked in or is away, or put two games on one court, whoever sends it.

## Scores, history and ratings

- **Results:** the organiser chooses whether players enter scores or just the winning side. With a target score (21 in badminton, 11 in squash and table tennis), scores can't be negative or tied, so every game has a winner. Enter the loser's score and the sheet suggests the winner's (first to 21, win by two, up to 30 in badminton). With no target set, any score is accepted, draws included.
- **History:** every game is kept with its players, sides and score. Players see their games played and win rate for free. The Player plan adds full match history, the leaderboard for each night they played, and their best partners and toughest rivals.
- **Ratings:** each player has an Elo rating per sport and per format: singles, doubles, and mixed (each side one man and one lady). After each game, each player is rated against the other side's average (K-factor 32, never below 100). Draws aren't rated. A new format starts from the player's rating in another format of the same sport, else from their self-declared level (Beginner 1200 up to Professional 1800), else 1500. Ratings drive Smart pick and skill-based picking. They aren't shown as a league table, so nobody plays to protect a number.

## The board in the hall

- **Session Board (free):** any tablet or phone becomes a live board showing every court, who's on, who's next, and how long everyone has waited. Players can check themselves in, step away and come back on it.
- **Locked to the organiser:** anything that changes the night on the board (approving check-ins, the picker's tools, resetting a court, ending the session) asks for the session PIN, which the organiser sets. The organiser can let players add players, pair up or edit guests without it. Leaving Session Board mode asks for the organiser's own phone unlock, because it hands their account back.
- **Club Board (Club plan):** dedicated courtside tablets registered to a club. Their settings are behind a separate device PIN that only the club admin can set.
- **Calling names aloud (Pro):** a chime, then who is on which court and whose pick it is, so nobody has to shout across the hall.

## When the signal drops

NextFour needs an internet connection: that is what lets every device in the hall show the same board. On a weak connection:

- the board stays on screen with a "Reconnecting" banner instead of going blank;
- actions are refused with a message while the device knows it is offline, so nothing is half done;
- an action sent just as the signal drops is retried for 30 seconds and applied exactly once.

There is no offline mode yet.

## Attendance and planning

- **Availability polls (free):** ask your players who can make the next session and see replies as they arrive. You can record answers yourself for people who tell you in person.
- Every game is kept with the session. On any paid plan, the session's match history lists them all and can be filtered to one night.
- An organiser can run several sessions at the same time, such as two halls on one night.

## Payments

NextFour doesn't take payments. You can show the price per person on a session, and players pay you as they do today.

## Plans

- **Free:** find sessions, join and play. Host as many sessions as you like with pegboard or manual picking, the Session Board and availability polls.
- **Player:** your full stats and match history, best partners and toughest rivals, and no ads.
- **Pro:** skill-based picking, King of the Court, player pairing, deputies, calling names aloud, QR and NFC check-in, recurring sessions and invite-only sessions.
- **Club:** everything in Pro, plus club admin, player grading, club leaderboards and dedicated Club Board terminals.

You'll see the prices in the app before you subscribe. Subscriptions are billed through the App Store or Google Play.

## How we test it

We play out whole club nights in software before a change to the picking goes live: 32 players over three hours, three to seven courts, late arrivals, breaks, early leavers, pairs and mixed nights. Some rules must hold in every run, with no exceptions:

- nobody is picked while away, before they arrive or after they leave;
- nobody is on two courts at once;
- no court sits empty while four players are free;
- in Fair rotation, the longest waiter is in every game.

Questions about any of this? Email [support@nextfour.app](mailto:support@nextfour.app).
