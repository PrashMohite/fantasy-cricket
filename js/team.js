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
   TEAM BUILDER LOGIC
   =============================== */
async function initTeamBuilder(matchId) {

  let selectedPlayers = [];
  let captain = null;
  let viceCaptain = null;
  let totalBudgetUsed = 0;

  const userName = getUserName();
  if (!userName) return;

  const playersContainer = document.getElementById("players");
  const budgetLeftEl = document.getElementById("budgetLeft");
  const playerCountEl = document.getElementById("playerCount");

  /* ===============================
     LOAD EXISTING TEAM (EDIT MODE)
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

      /* 🔝 SORT: Playing → TBD → Not Playing */
      matchPlayers.sort((a, b) => {
        const normalize = v => {
          const s = String(v || "").trim().toLowerCase();
          if (["yes", "y", "playing", "true"].includes(s)) return 0;
          if (["no", "n", "not playing", "false"].includes(s)) return 2;
          return 1;
        };
        return normalize(a.is_playing) - normalize(b.is_playing);
      });

      matchPlayers.forEach(player => renderPlayer(player));
    });

  function renderPlayer(player) {
    const card = document.createElement("div");

    /* ===============================
       NORMALIZE PLAYING STATUS
       =============================== */
    const rawStatus = String(player.is_playing || "").trim().toLowerCase();

    let playingStatus = "team not declared";
    if (["yes", "y", "playing", "true"].includes(rawStatus)) {
      playingStatus = "yes";
    } else if (["no", "n", "not playing", "false"].includes(rawStatus)) {
      playingStatus = "no";
    }

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
      totalBudgetUsed += Number(player.price);
      card.classList.add("selected");
    }

    card.innerHTML = `
      <div class="player-info">
        <div class="player-name">
          ${player.player_name}
          ${badgeHtml}
        </div>
        <div class="player-team">${player.team}</div>
      </div>

      <div class="player-right">
        <div class="price">${player.price} Cr</div>
        <button class="add-btn ${isSelected ? "remove" : ""}">
          ${isSelected ? "REMOVE" : "ADD"}
        </button>
        <div class="cv-buttons" style="margin-top:6px;display:${isSelected ? "block" : "none"}">
          <button class="cv-btn ${player.player_id === captain ? "selected" : ""}">C</button>
          <button class="cv-btn ${player.player_id === viceCaptain ? "selected" : ""}">VC</button>
        </div>
      </div>
    `;

    const addBtn = card.querySelector(".add-btn");
    const cvDiv = card.querySelector(".cv-buttons");
    const cBtn = cvDiv.children[0];
    const vcBtn = cvDiv.children[1];

    addBtn.onclick = () => togglePlayer(player, addBtn, cvDiv);
    cBtn.onclick = e => setCaptain(player.player_id, e.target);
    vcBtn.onclick = e => setViceCaptain(player.player_id, e.target);

    playersContainer.appendChild(card);
    updateBottomBar();
  }

  function togglePlayer(player, addBtn, cvDiv) {
    const id = player.player_id;
    const price = Number(player.price);
    const card = addBtn.closest(".player-card");

    if (selectedPlayers.includes(id)) {
      selectedPlayers = selectedPlayers.filter(p => p !== id);
      totalBudgetUsed -= price;

      addBtn.innerText = "ADD";
      addBtn.classList.remove("remove");
      cvDiv.style.display = "none";
      card.classList.remove("selected");

      if (captain === id) captain = null;
      if (viceCaptain === id) viceCaptain = null;

    } else {
      if (selectedPlayers.length >= 5) return alert("Only 5 players allowed");
      if (totalBudgetUsed + price > 100) return alert("Budget exceeded");

      selectedPlayers.push(id);
      totalBudgetUsed += price;

      addBtn.innerText = "REMOVE";
      addBtn.classList.add("remove");
      cvDiv.style.display = "block";
      card.classList.add("selected");
    }

    updateBottomBar();
  }

  function setCaptain(id, btn) {
    if (viceCaptain === id) return alert("Player already Vice-Captain");
    captain = id;
    document.querySelectorAll(".cv-btn").forEach(b => {
      if (b.innerText === "C") b.classList.remove("selected");
    });
    btn.classList.add("selected");
  }

  function setViceCaptain(id, btn) {
    if (captain === id) return alert("Player already Captain");
    viceCaptain = id;
    document.querySelectorAll(".cv-btn").forEach(b => {
      if (b.innerText === "VC") b.classList.remove("selected");
    });
    btn.classList.add("selected");
  }

  function updateBottomBar() {
    budgetLeftEl.innerText = 100 - totalBudgetUsed;
    playerCountEl.innerText = `${selectedPlayers.length}/5`;
  }

  window.submitTeam = async function () {

    if (selectedPlayers.length !== 5) {
      alert("Please select exactly 5 players");
      return;
    }

    if (!captain || !viceCaptain) {
      alert("Please select Captain and Vice-Captain");
      return;
    }

    const formData = new FormData();
    formData.append("entry.704005628", matchId);
    formData.append("entry.1462026748", userName);
    formData.append("entry.1355324857", selectedPlayers.join(","));
    formData.append("entry.1366871684", totalBudgetUsed);
    formData.append("entry.1261443260", captain);
    formData.append("entry.407412360", viceCaptain);

    fetch(
      "https://docs.google.com/forms/d/e/1FAIpQLSddB9IdLhzUUCR3CKobjLSgdA43BATV1VxgqSEuzNifOlvlSg/formResponse",
      { method: "POST", body: formData, mode: "no-cors" }
    );

    alert("Team saved successfully ✅");
    window.location.href = "index.html";
  };
}
