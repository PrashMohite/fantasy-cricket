document.addEventListener("DOMContentLoaded", async () => {

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("match");

  if (!matchId) {
    document.body.innerHTML =
      "<h2 style='text-align:center;margin-top:40px;'>Invalid Match</h2>";
    return;
  }

  /* ===============================
     FETCH MATCH & CHECK STATUS
     =============================== */
  let match;

  try {
    const res = await fetch(URLS.matches);
    const matches = await res.json();

    match = matches.find(
      m => String(m.match_id).trim() === String(matchId).trim()
    );

    if (!match) {
      document.body.innerHTML =
        "<h2 style='text-align:center;margin-top:40px;'>Match not found</h2>";
      return;
    }
  } catch (err) {
    console.error(err);
    document.body.innerHTML =
      "<h2 style='text-align:center;margin-top:40px;'>Error loading match</h2>";
    return;
  }

  const status = (match.status || "").toLowerCase().trim();

  if (status === "live") {
    document.body.innerHTML = `
      <h2 style="text-align:center;margin-top:40px;">
        Sorry, you are late 😕<br>
        <small>Match is live</small>
      </h2>`;
    return;
  }

  if (status === "completed") {
    document.body.innerHTML = `
      <h2 style="text-align:center;margin-top:40px;">
        Match completed 🏁
      </h2>`;
    return;
  }

  initTeamBuilder(matchId);
});

/* ===============================
   TEAM BUILDER
   =============================== */
async function initTeamBuilder(matchId) {

  let selectedPlayers = [];
  let captain = null;
  let viceCaptain = null;
  let totalBudgetUsed = 0;
  const playerDataMap = {};

  let roleCount = {
  batter: 0,
  bowler: 0,
  wicketkeeper: 0,
  allrounder: 0
};

let teamCount = {};   // { "IND": 3, "AUS": 2 }

/* ===============================
   ROLE NORMALIZATION (FIXED)
=============================== */
function normalizeRole(role) {

  if (!role) return "unknown";

  const r = String(role)
    .replace(/["']/g, "")        // remove quotes if any
    .replace(/\s+/g, " ")        // collapse spaces
    .trim()
    .toLowerCase();

  // DEBUG (can remove later)
  console.log("ROLE FROM SHEET:", r);

  if (r.includes("wk") || r.includes("wk-batter"))
    return "wicketkeeper";

  if (r.includes("batter"))
    return "batter";

  if (r.includes("bowler"))
    return "bowler";

  if (r.includes("allrounder"))
    return "allrounder";

  return "unknown";
};




  const userName = getUserName();
  if (!userName) return;

  const playersContainer = document.getElementById("players");
  const budgetLeftEl = document.getElementById("budgetLeft");
  const playerCountEl = document.getElementById("playerCount");

  /* ===============================
     LOAD GLOBAL PLAYER DATA ✅
     =============================== */
  const globalRes = await fetch(URLS.globalPlayers);
  const globalPlayers = await globalRes.json();

  const globalPlayerMap = {};
  globalPlayers.forEach(g => {
    globalPlayerMap[String(g.global_player_id).trim()] = g;
  });

  /* ===============================
     LOAD EXISTING TEAM
     =============================== */
  let existingTeam = null;

  try {
    const res = await fetch(URLS.teams);
    const teams = await res.json();

    existingTeam = teams
      .filter(t =>
        String(t["Match ID"]).trim() === String(matchId).trim() &&
        t["User Name"].trim().toLowerCase() === userName.toLowerCase()
      )
      .pop();
  } catch (e) {
    console.error("Error loading existing team");
  }

  if (existingTeam) {
    selectedPlayers = existingTeam["Player IDs"].split(",");
    captain = existingTeam["Captain ID"];
    viceCaptain = existingTeam["Vice Captain ID"];
  }



  /* ===============================
     LOAD PLAYERS
     =============================== */
  fetch(URLS.players)
    .then(res => res.json())
    .then(players => {

      const matchPlayers = players.filter(
        p => String(p.match_id) === String(matchId)
      );

      matchPlayers.sort((a, b) => {
        const norm = v => {
          const s = String(v || "").toLowerCase();
          if (["yes", "playing"].includes(s)) return 0;
          if (["no", "not playing"].includes(s)) return 2;
          return 1;
        };
        return norm(a.is_playing) - norm(b.is_playing);
      });



    /* ===============================
   GROUP PLAYERS BY TEAM
   =============================== */

const teamMap = {};

// create groups
matchPlayers.forEach(p => {
  const teamName = String(p.team || "Unknown").trim();

  if (!teamMap[teamName]) {
    teamMap[teamName] = [];
  }

  teamMap[teamName].push(p);
});

  
/* ===============================
   REBUILD COUNTS FOR EDIT MODE
=============================== */

if (selectedPlayers.length > 0) {

  selectedPlayers.forEach(pid => {

    const player = matchPlayers.find(p => p.player_id === pid);
    if (!player) return;

    // Budget
    totalBudgetUsed += Number(player.price || 0);

    // Role count
    const role = normalizeRole(player.Role || player.role);
    if (roleCount[role] !== undefined) {
      roleCount[role]++;
    }

    // Team count
    const teamName = String(player.team || "").trim();
    teamCount[teamName] = (teamCount[teamName] || 0) + 1;
  });
}


/* ===============================
   RENDER TEAM BY TEAM
   =============================== */

Object.keys(teamMap).forEach(teamName => {

  renderTeamHeader(teamName);

  teamMap[teamName].forEach(player => {
    renderPlayer(player);   // ← YOUR EXISTING CARD (UNCHANGED)
  });

});



    });

  /* ===============================
     RENDER PLAYER CARD (UNCHANGED UI)
     =============================== */
  function renderPlayer(player) {
    playerDataMap[player.player_id] = player;

    const card = document.createElement("div");

    const rawStatus = String(player.is_playing || "").trim().toLowerCase();
    let playingStatus = "tbd";
    if (["yes", "y", "playing", "true"].includes(rawStatus)) playingStatus = "yes";
    else if (["no", "n", "not playing", "false"].includes(rawStatus)) playingStatus = "no";

    let badgeHtml = "";
    let cardClass = "undecided";

    if (playingStatus === "yes") {
      badgeHtml = `<span class="xi-badge xi-yes">✔</span>`;
      cardClass = "playing";
    } else if (playingStatus === "no") {
      badgeHtml = `<span class="xi-badge xi-no">✖</span>`;
      cardClass = "not-playing";
    } else {
      badgeHtml = `<span class="xi-badge xi-tbd">?</span>`;
    }

    card.className = `player-card ${cardClass}`;

    const isSelected = selectedPlayers.includes(player.player_id);
    if (isSelected) {
      //totalBudgetUsed += Number(player.price);
      card.classList.add("selected");
    }

    /* ===============================
       ✅ REAL GLOBAL STATS (NO UI CHANGE)
       =============================== */
    const g =
      globalPlayerMap[String(player.global_player_id).trim()] || {};

    const career = {
      matches: g.total_t20_matches || 0,
      runs: g.total_t20_runs || 0,
      wkts: g.total_t20_wickets || 0
    };

    const wc = {
      matches: g.wc2026_matches || 0,
      runs: g.wc2026_runs || 0,
      wkts: g.wc2026_wickets || 0
    };

    card.innerHTML = `
      <div class="player-top clickable">
        <div>
          <div class="player-name">
            ${player.player_name} ${badgeHtml}
            <span class="expand-icon">▼</span>
          </div>
         
          <div class="player-role">Role: ${player.Role || "—"}</div>
        </div>

        <div class="player-actions">
          <div class="price">${player.price} Cr</div>
          <button class="add-btn ${isSelected ? "remove" : ""}">
            ${isSelected ? "REMOVE" : "ADD"}
          </button>
        </div>
      </div>

      <div class="player-stats collapsed">
        <div class="stats-section">
          <div class="stats-title">CAREER (T20 Overall)</div>
          <div class="stats-row">
            🏏 Matches: <b>${career.matches}</b>
            &nbsp; | 🔥 Runs: <b>${career.runs}</b>
            &nbsp; | 🎯 Wkts: <b>${career.wkts}</b>
          </div>
        </div>

        <div class="stats-section wc">
          <div class="stats-title">T20 WC 2026 PERFORMANCE</div>
          <div class="stats-row">
            🏏 Matches: <b>${wc.matches}</b>
            &nbsp; | 🔥 Runs: <b>${wc.runs}</b>
            &nbsp; | 🎯 Wkts: <b>${wc.wkts}</b>
          </div>
        </div>
      </div>

      <div class="cv-buttons" style="display:${isSelected ? "flex" : "none"}">
        <button class="cv-btn ${player.player_id === captain ? "selected" : ""}">C</button>
        <button class="cv-btn ${player.player_id === viceCaptain ? "selected" : ""}">VC</button>
      </div>
    `;

    const addBtn = card.querySelector(".add-btn");
    const cvDiv = card.querySelector(".cv-buttons");
    const cBtn = cvDiv.children[0];
    const vcBtn = cvDiv.children[1];

    /* ===============================
   TAP TO SHOW / HIDE STATS
   =============================== */
const header = card.querySelector(".player-top");
const statsBox = card.querySelector(".player-stats");

header.addEventListener("click", (e) => {

  // Prevent toggle when clicking ADD button
  if (e.target.classList.contains("add-btn")) return;

  statsBox.classList.toggle("open");
  statsBox.classList.toggle("collapsed");
});


    addBtn.onclick = () => togglePlayer(player, addBtn, cvDiv);
    cBtn.onclick = e => setCaptain(player.player_id, e.target);
    vcBtn.onclick = e => setViceCaptain(player.player_id, e.target);

    playersContainer.appendChild(card);
    updateBottomBar();
  }

  /* ===============================
   TEAM HEADER
   =============================== */
function renderTeamHeader(teamName) {

  const section = document.createElement("div");
  section.className = "team-section";

  section.innerHTML = `
    <div class="team-title">
      ${teamName.toUpperCase()} 
    </div>
  `;

  playersContainer.appendChild(section);
}


  /* ===============================
     SELECTION LOGIC (UNCHANGED)
     =============================== */
function togglePlayer(player, btn, cvDiv) {

  const id = player.player_id;
  const price = Number(player.price);
  const team = String(player.team).trim();
  const role = normalizeRole(player.Role);

  const card = btn.closest(".player-card");

  /* ===============================
     REMOVE PLAYER
  =============================== */
  if (selectedPlayers.includes(id)) {

    selectedPlayers = selectedPlayers.filter(p => p !== id);
    totalBudgetUsed -= price;

    // update role count
    if (roleCount[role] !== undefined) roleCount[role]--;

    // update team count
    teamCount[team]--;
    if (teamCount[team] <= 0) delete teamCount[team];

    btn.innerText = "ADD";
    btn.classList.remove("remove");
    cvDiv.style.display = "none";
    card.classList.remove("selected");

    if (captain === id) captain = null;
    if (viceCaptain === id) viceCaptain = null;

    updateBottomBar();
    return;
  }

  /* ===============================
     VALIDATIONS BEFORE ADD
  =============================== */

  // RULE 1 → Max 11 players
  if (selectedPlayers.length >= 11) {
    alert("You can select only 11 players");
    return;
  }

  // RULE 2 → Max 6 from same team
  if ((teamCount[team] || 0) >= 6) {
    alert("Maximum 6 players allowed from one team");
    return;
  }

  // RULE 3 → Budget
  if (totalBudgetUsed + price > 100) {
    alert("Budget exceeded");
    return;
  }

  /* ===============================
     ADD PLAYER
  =============================== */

  selectedPlayers.push(id);
  totalBudgetUsed += price;

  // update role count
  if (roleCount[role] !== undefined) roleCount[role]++;

  // update team count
  teamCount[team] = (teamCount[team] || 0) + 1;

  btn.innerText = "REMOVE";
  btn.classList.add("remove");
  cvDiv.style.display = "flex";
  card.classList.add("selected");

  updateBottomBar();
}

  function setCaptain(id, btn) {
    if (viceCaptain === id) return alert("Already Vice-Captain");
    captain = id;
    document.querySelectorAll(".cv-btn").forEach(b => {
      if (b.innerText === "C") b.classList.remove("selected");
    });
    btn.classList.add("selected");
  }

  function setViceCaptain(id, btn) {
    if (captain === id) return alert("Already Captain");
    viceCaptain = id;
    document.querySelectorAll(".cv-btn").forEach(b => {
      if (b.innerText === "VC") b.classList.remove("selected");
    });
    btn.classList.add("selected");
  }

  function updateBottomBar() {
    budgetLeftEl.innerText = 100 - totalBudgetUsed;
    playerCountEl.innerText = `${selectedPlayers.length}/11`;
  }

  /* ===============================
   REVIEW SCREEN LOGIC
=============================== */

function openReviewScreen() {

  const overlay = document.getElementById("teamReviewOverlay");
  const list = document.getElementById("reviewPlayers");

  list.innerHTML = "";

  selectedPlayers.forEach(id => {

    const p = playerDataMap[id];

    let roleTag = "";
    if (id === captain) roleTag = " (C)";
    if (id === viceCaptain) roleTag = " (VC)";

    const row = document.createElement("div");
    row.className = "review-player";
    row.innerHTML = `
      ${p.player_name}
      <span>${roleTag}</span>
    `;

    list.appendChild(row);
  });

  overlay.classList.remove("hidden");
}


/* CANCEL → Back to Edit */
document.getElementById("cancelReview").onclick = () => {
  document.getElementById("teamReviewOverlay").classList.add("hidden");
};


/* CONFIRM → FINAL SUBMIT */
document.getElementById("confirmSubmit").onclick = async () => {

  const formData = new FormData();
  formData.append("entry.704005628", matchId);
  formData.append("entry.1462026748", userName);
  formData.append("entry.1355324857", selectedPlayers.join(","));
  formData.append("entry.1366871684", totalBudgetUsed);
  formData.append("entry.1261443260", captain);
  formData.append("entry.407412360", viceCaptain);

  await fetch(
    "https://docs.google.com/forms/d/e/1FAIpQLSddB9IdLhzUUCR3CKobjLSgdA43BATV1VxgqSEuzNifOlvlSg/formResponse",
    { method: "POST", body: formData, mode: "no-cors" }
  );

  window.location.href = "index.html";
};


window.submitTeam = function () {

  if (selectedPlayers.length !== 11) {
  alert("Team must contain exactly 11 players");
  return;
}

if (roleCount.batter < 2) {
  alert("Minimum 2 Batters required");
  return;
}

if (roleCount.bowler < 2) {
  alert("Minimum 2 Bowlers required");
  return;
}

if (roleCount.wicketkeeper < 1) {
  alert("At least 1 Wicketkeeper required");
  return;
}

if (!captain || !viceCaptain) {
  alert("Select Captain and Vice Captain");
  return;
}
  openReviewScreen();
};

}
