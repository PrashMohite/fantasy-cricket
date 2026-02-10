const SHEET_ID = "1NdJuCQgtdR6vUd5QAhgqb7jTGuXX5avB2iXkAbnCewI";


const URLS = {
  matches: `https://opensheet.elk.sh/${SHEET_ID}/Matches`,
  players: `https://opensheet.elk.sh/${SHEET_ID}/Players`,
  //teams: `https://opensheet.elk.sh/${SHEET_ID}/Teams`,
  teams: `https://opensheet.elk.sh/${SHEET_ID}/Form Responses 1`,
  

  points: `https://opensheet.elk.sh/${SHEET_ID}/Points`,
  liveStats: `https://opensheet.elk.sh/${SHEET_ID}/LiveStats`,
  responses: `https://opensheet.elk.sh/${SHEET_ID}/Form Responses 1`,
  users : `https://opensheet.elk.sh/${SHEET_ID}/Users`,
  tournament : `https://opensheet.elk.sh/${SHEET_ID}/Tournament`,
  balance : `https://opensheet.elk.sh/${SHEET_ID}/Balance`,
  globalPlayers : `https://opensheet.elk.sh/${SHEET_ID}/global_players`

};

/* ===============================
   USER IDENTIFICATION (GLOBAL)
   =============================== */
function getUserName() {
  let name = localStorage.getItem("fantasy_user");

  if (!name) {
    name = prompt("Enter your name");
    if (!name) return null;

    name = name.trim();
    localStorage.setItem("fantasy_user", name);
  }

  return name;
}

