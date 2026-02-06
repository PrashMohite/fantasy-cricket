document.addEventListener("DOMContentLoaded", async () => {

  const teamsDiv = document.getElementById("teams");
  const winnerBanner = document.getElementById("winnerBanner");

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("match");

  if (!matchId) {
    teamsDiv.innerText = "Match not specified";
    return;
  }

  try {
    /* ===============================
       FETCH ALL REQUIRED DATA
       =============================== */
    const [
      playersRes,
      teamsRes,
      statsRes,
      pointsRes,
      matchesRes
    ] = await Promise.all([
      fetch(URLS.players),
      fetch(URLS.teams),
      fetch(URLS.liveStats),
      fetch(URLS.points),
      fetch(URLS.matches)
    ]);

    const players = await playersRes.json();
    const teams = await teamsRes.json();
    const stats = await statsRes.json();
    const points = await pointsRes.json();
    const matches = await matchesRes.json();

    /* ===============================
       MATCH STATUS (FOR WINNER BANNER)
       =============================== */
    const currentMatch = matches.find(
      m => String(m.match_id) === String(matchId)
    );
    const matchStatus = (currentMatch?.status || "").toLowerCase();

   // 🎨 Apply header color based on match status
const header = document.querySelector(".page-header");

if (header && matchStatus) {
  header.classList.add(matchStatus);
}

if (header && matchStatus) {
  header.classList.add(matchStatus);
}

    /* ===============================
       PLAYER & STATS LOOKUPS
       =============================== */

    const playerMap = {};
    players.forEach(p => {
      playerMap[p.player_id] = p.player_name;
    });

    const statsMap = {};
    stats
      .filter(s => String(s.match_id) === String(matchId))
      .forEach(s => {
        statsMap[s.player_id] = {
          runs: Number(s.runs || 0),
          wickets: Number(s.wickets || 0)
        };
      });

    let runPoint = 1;
    let wicketPoint = 25;
    points.forEach(p => {
      if (p.action === "run") runPoint = Number(p.points);
      if (p.action === "wicket") wicketPoint = Number(p.points);
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
       CALCULATE POINTS
       =============================== */
    const leaderboard = matchTeams.map(team => {
      const playerIds = team["Player IDs"].split(",");
      const captain = team["Captain ID"];
      const viceCaptain = team["Vice Captain ID"];

      let totalPoints = 0;
      let playerLines = [];

      playerIds.forEach(pid => {
        const stat = statsMap[pid] || { runs: 0, wickets: 0 };

        let pts =
          (stat.runs * runPoint) +
          (stat.wickets * wicketPoint);

        let label = playerMap[pid] || pid;

        if (pid === captain) {
          pts *= 2;
          label += " ⭐ (C)";
        } else if (pid === viceCaptain) {
          pts *= 1.5;
          label += " 🔥 (VC)";
        }

        totalPoints += pts;
        playerLines.push(`${label} — ${pts} pts`);
      });

      return {
        user: team["User Name"],
        totalPoints,
        playerLines
      };
    });

    /* ===============================
       SORT LEADERBOARD
       =============================== */
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    /* ===============================
       🏆 WINNER BANNER (STEP C)
       =============================== */
    if (matchStatus === "completed" && leaderboard.length > 0) {
      const winner = leaderboard[0];

      winnerBanner.innerHTML = `
        <div class="winner-banner">
          🏆 Winner: ${winner.user}<br>
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
            <div class="team-user">${team.user}</div>
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
