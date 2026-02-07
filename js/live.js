document.addEventListener("DOMContentLoaded", async () => {

  const teamsDiv = document.getElementById("teams");
  const winnerBanner = document.getElementById("winnerBanner");
  const header = document.querySelector(".page-header");

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("match");

  if (!matchId) {
    teamsDiv.innerText = "Match not specified";
    return;
  }

  /* ===============================
     FANTASY POINTS CALCULATOR
     =============================== */
  function calculateFantasyPoints(stat) {
    let points = 0;

    const runs = Number(stat.runs || 0);
    const fours = Number(stat.fours || 0);
    const sixes = Number(stat.sixes || 0);
    const wickets = Number(stat.wickets || 0);
    const catches = Number(stat.catches || 0);
    const runOuts = Number(stat.run_outs || 0);
    const lbw = Number(stat.lbw || 0);

    // Batting
    points += runs * 2;
    points += fours * 1;
    points += sixes * 2;

    if (runs >= 100) points += 50;
    else if (runs >= 50) points += 25;

    if (runs === 0) points -= 50;

    // Bowling / Fielding
    points += wickets * 50;
    if (wickets >= 3) points += 25;

    points += catches * 5;
    points += runOuts * 5;
    points += lbw * 5;

    if (wickets === 0) points -= 50;

    return points;
  }

  try {
    /* ===============================
       FETCH ALL REQUIRED DATA
       =============================== */
    const [
      playersRes,
      teamsRes,
      statsRes,
      matchesRes,
      usersRes
    ] = await Promise.all([
      fetch(URLS.players),
      fetch(URLS.teams),
      fetch(URLS.liveStats),
      fetch(URLS.matches),
      fetch(URLS.users)
    ]);

    const players = await playersRes.json();
    const teams = await teamsRes.json();
    const stats = await statsRes.json();
    const matches = await matchesRes.json();
    const users = await usersRes.json();

    /* ===============================
       USER MAP (STEP 3)
       =============================== */
    const userMap = {};
    users.forEach(u => {
      userMap[u.username.toLowerCase()] = {
        name: u.display_name,
        photo: u.photo_url
      };
    });

    /* ===============================
       MATCH STATUS + HEADER COLOR
       =============================== */
    const currentMatch = matches.find(
      m => String(m.match_id) === String(matchId)
    );
    const matchStatus = (currentMatch?.status || "").toLowerCase();

    if (header && matchStatus) {
      header.classList.add(matchStatus);
    }

    /* ===============================
       PLAYER & STATS MAPS
       =============================== */
    const playerMap = {};
    players.forEach(p => {
      playerMap[p.player_id] = p.player_name;
    });

    const statsMap = {};
    stats
      .filter(s => String(s.match_id) === String(matchId))
      .forEach(s => {
        statsMap[s.player_id] = s;
      });

    /* ===============================
       DEDUPE TEAMS (LATEST PER USER)
       =============================== */
    const matchTeamsRaw = teams.filter(
      t => String(t["Match ID"]) === String(matchId)
    );

    if (matchTeamsRaw.length === 0) {
      teamsDiv.innerText = "No teams submitted yet";
      return;
    }

    const teamMap = {};
    matchTeamsRaw.forEach(t => {
      const key = t["User Name"].trim().toLowerCase();
      teamMap[key] = t;
    });

    const matchTeams = Object.values(teamMap);

    /* ===============================
       CALCULATE LEADERBOARD
       =============================== */
    const leaderboard = matchTeams.map(team => {
      const playerIds = team["Player IDs"].split(",");
      const captain = team["Captain ID"];
      const viceCaptain = team["Vice Captain ID"];

      let totalPoints = 0;
      let playerLines = [];

      playerIds.forEach(pid => {
        const stat = statsMap[pid] || {};
        let pts = calculateFantasyPoints(stat);

        let label = playerMap[pid] || pid;

        if (pid === captain) {
          pts *= 2;
          label += " ⭐ (C)";
        } else if (pid === viceCaptain) {
          pts *= 1.5;
          label += " 🔥 (VC)";
        }

        totalPoints += pts;
        playerLines.push(`${label} — ${Math.round(pts)} pts`);
      });

      const uname = team["User Name"].toLowerCase();
      const userInfo = userMap[uname] || {
        name: team["User Name"],
        photo: "https://via.placeholder.com/40"
      };

      return {
        userName: userInfo.name,
        userPhoto: userInfo.photo,
        totalPoints: Math.round(totalPoints),
        playerLines
      };
    });

    /* ===============================
       SORT LEADERBOARD
       =============================== */
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    /* ===============================
       🏆 WINNER BANNER
       =============================== */
    if (matchStatus === "completed" && leaderboard.length > 0) {
      const winner = leaderboard[0];
      winnerBanner.innerHTML = `
        <div class="winner-banner">
          🏆 Winner: ${winner.userName}<br>
          ${winner.totalPoints} points
        </div>
      `;
    }

    /* ===============================
       RENDER LEADERBOARD
       =============================== */
    teamsDiv.innerHTML = "";

    leaderboard.forEach((team, index) => {
      let badge = "";
      if (index === 0) badge = "🥇";
      else if (index === 1) badge = "🥈";
      else if (index === 2) badge = "🥉";

      const card = document.createElement("div");
      card.className = "team-card";

      if (index === 0) card.classList.add("gold");
      else if (index === 1) card.classList.add("silver");
      else if (index === 2) card.classList.add("bronze");

      card.innerHTML = `
        <div class="rank">${badge || index + 1}</div>
        <div class="team-content">
          <div class="team-header">
            <div class="team-user-row">
              <img src="${team.userPhoto}" class="user-avatar">
              <span>${team.userName}</span>
            </div>
            <div class="team-total">${team.totalPoints} pts</div>
          </div>
          ${team.playerLines
            .map(line => {
              let cls = "";
              if (line.includes("(C)")) cls = "captain";
              if (line.includes("(VC)")) cls = "vice";
              return `<div class="player-line ${cls}">${line}</div>`;
            })
            .join("")}
        </div>
      `;

      teamsDiv.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    teamsDiv.innerText = "Error loading leaderboard";
  }
});
