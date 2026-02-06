document.addEventListener("DOMContentLoaded", async () => {

  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("match");

  if (!matchId) {
    document.body.innerHTML =
      "<h2 style='text-align:center;margin-top:40px;'>Invalid Match</h2>";
    return;
  }

  /* ===============================
     1️⃣ MATCH STATUS CHECK
     =============================== */
  try {
    const matchRes = await fetch(URLS.matches);
    const matches = await matchRes.json();

    const match = matches.find(
      m => String(m.match_id).trim() === String(matchId).trim()
    );

    if (!match) {
      document.body.innerHTML =
        "<h2 style='text-align:center;margin-top:40px;'>Match not found</h2>";
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

  } catch (err) {
    console.error(err);
    document.body.innerHTML =
      "<h2 style='text-align:center;margin-top:40px;'>Error loading match</h2>";
    return;
  }

  /* ===============================
     2️⃣ DEVICE LOCK (EXTRA SAFETY)
     =============================== */
  const localLockKey = "team_submitted_" + matchId;
  if (localStorage.getItem(localLockKey)) {
    document.body.innerHTML = `
      <h2 style="text-align:center;margin-top:40px;">
        You have already submitted your team 🔒
      </h2>`;
    return;
  }

  /* ===============================
     3️⃣ TEAM BUILDER LOGIC
     =============================== */
  let selectedPlayers = [];
  let captain = null;
  let viceCaptain = null;
  let totalBudgetUsed = 0;

  const playersContainer = document.getElementById("players");
  const budgetLeftEl = document.getElementById("budgetLeft");
  const playerCountEl = document.getElementById("playerCount");

  fetch(URLS.players)
    .then(res => res.json())
    .then(players => {
      players
        .filter(p => String(p.match_id) === String(matchId))
        .forEach(player => renderPlayer(player));
    });

  function renderPlayer(player) {
    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `
      <div class="player-info">
        <div class="player-name">${player.player_name}</div>
        <div class="player-team">${player.team}</div>
      </div>

      <div class="player-right">
        <div class="price">${player.price} Cr</div>
        <button class="add-btn">ADD</button>
        <div class="cv-buttons" style="margin-top:6px;display:none">
          <button class="cv-btn">C</button>
          <button class="cv-btn">VC</button>
        </div>
      </div>
    `;

    const addBtn = card.querySelector(".add-btn");
    const cvDiv = card.querySelector(".cv-buttons");
    const cBtn = cvDiv.children[0];
    const vcBtn = cvDiv.children[1];

    addBtn.onclick = () => togglePlayer(player, addBtn, cvDiv);
    cBtn.onclick = () => setCaptain(player.player_id);
    vcBtn.onclick = () => setViceCaptain(player.player_id);

    playersContainer.appendChild(card);
  }

  function togglePlayer(player, addBtn, cvDiv) {
    const id = player.player_id;
    const price = Number(player.price);

    if (selectedPlayers.includes(id)) {
      selectedPlayers = selectedPlayers.filter(p => p !== id);
      totalBudgetUsed -= price;
      addBtn.innerText = "ADD";
      cvDiv.style.display = "none";

      if (captain === id) captain = null;
      if (viceCaptain === id) viceCaptain = null;
    } else {
      if (selectedPlayers.length >= 5) {
        alert("Only 5 players allowed");
        return;
      }
      if (totalBudgetUsed + price > 100) {
        alert("Budget exceeded");
        return;
      }

      selectedPlayers.push(id);
      totalBudgetUsed += price;
      addBtn.innerText = "REMOVE";
      cvDiv.style.display = "block";
    }

    updateBottomBar();
  }

  function setCaptain(id) {
    if (!selectedPlayers.includes(id)) return;
    if (viceCaptain === id) {
      alert("Player already Vice-Captain");
      return;
    }
    captain = id;
    alert("Captain selected");
  }

  function setViceCaptain(id) {
    if (!selectedPlayers.includes(id)) return;
    if (captain === id) {
      alert("Player already Captain");
      return;
    }
    viceCaptain = id;
    alert("Vice-Captain selected");
  }

  function updateBottomBar() {
    budgetLeftEl.innerText = 100 - totalBudgetUsed;
    playerCountEl.innerText = `${selectedPlayers.length}/5`;
  }

  /* ===============================
     4️⃣ SUBMIT TEAM (ONE TIME ONLY)
     =============================== */
  window.submitTeam = async function () {

    if (selectedPlayers.length !== 5) {
      alert("Please select exactly 5 players");
      return;
    }

    if (!captain || !viceCaptain) {
      alert("Please select Captain and Vice-Captain");
      return;
    }

    const userName = prompt("Enter your name");
    if (!userName) return;

    const cleanName = userName.trim().toLowerCase();

    try {
      // GLOBAL CHECK (GOOGLE SHEET)
      const res = await fetch(URLS.teams);
      const submissions = await res.json();

      const alreadySubmitted = submissions.some(row =>
        String(row["Match ID"]).trim() === String(matchId).trim() &&
        String(row["User Name"]).trim().toLowerCase() === cleanName
      );

      if (alreadySubmitted) {
        alert("You have already submitted a team for this match ❌");
        return;
      }

      // SUBMIT TO GOOGLE FORM
      const formURL = "PASTE_YOUR_formResponse_URL_HERE";

      const formData = new FormData();
      formData.append("entry.704005628", matchId);
      formData.append("entry.1462026748", userName);
      formData.append("entry.1355324857", selectedPlayers.join(","));
      formData.append("entry.1366871684", totalBudgetUsed);
      formData.append("entry.1261443260", captain);
      formData.append("entry.407412360", viceCaptain);

      fetch(formURL, {
        method: "POST",
        body: formData,
        mode: "no-cors"
      });

      localStorage.setItem(localLockKey, "true");

      alert("Team submitted successfully ✅");
      window.location.href = `live.html?match=${matchId}`;

    } catch (err) {
      console.error(err);
      alert("Error submitting team");
    }
  };

});
