document.addEventListener("DOMContentLoaded", async () => {

  const container = document.getElementById("balanceBoard");
  const updatedTillEl = document.getElementById("balanceUpdatedTill");

  if (!container || !updatedTillEl) {
    console.error("balanceBoard or balanceUpdatedTill missing");
    return;
  }

  try {
    const [balanceRes, usersRes] = await Promise.all([
      fetch(URLS.balance),
      fetch(URLS.users)
    ]);

    const rows = await balanceRes.json();
    const users = await usersRes.json();

    /* ===============================
       USER MAP
       =============================== */
    const userMap = {};
    users.forEach(u => {
      userMap[u.username.toLowerCase()] = {
        name: u.display_name || u.username,
        photo: u.photo_url || "https://via.placeholder.com/60"
      };
    });

    /* ===============================
       LAST MATCH LABEL
       =============================== */
    const validRows = rows.filter(r => r["Match Id"]);
    const lastMatch = validRows[validRows.length - 1]["Match Id"];
    updatedTillEl.innerText = `Balance updated till ${lastMatch}`;

    /* ===============================
       TOTAL BALANCE PER USER
       =============================== */
    const totals = {};

    validRows.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== "Match Id") {
          const val = Number(row[key] || 0);
          totals[key.toLowerCase()] = (totals[key.toLowerCase()] || 0) + val;
        }
      });
    });

    /* ===============================
       SORT (OPTIONAL: highest first)
       =============================== */
    const leaderboard = Object.entries(totals)
      .map(([username, total]) => {
        const info = userMap[username] || {
          name: username,
          photo: "https://via.placeholder.com/60"
        };
        return {
          userName: info.name,
          userPhoto: info.photo,
          total
        };
      })
      .sort((a, b) => b.total - a.total);

    /* ===============================
       RENDER
       =============================== */
    container.innerHTML = "";

    leaderboard.forEach(u => {
      const card = document.createElement("div");
      card.className = `balance-card ${u.total >= 0 ? "positive" : "negative"}`;

      card.innerHTML = `
        <div class="balance-left">
          <img src="${u.userPhoto}" class="balance-avatar"
               onerror="this.src='https://via.placeholder.com/60'">
          <div class="balance-name">${u.userName}</div>
        </div>

        <div class="balance-amount">
          ₹ ${u.total}
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerText = "Error loading balance";
  }
});
