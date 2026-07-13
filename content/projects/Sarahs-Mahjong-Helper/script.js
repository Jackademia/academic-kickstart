//RegisterListeners/ID
const button = document.getElementById("analyzeBtn");
const deleteBtn = document.getElementById("backspaceBtn");

button.addEventListener("click", analyzeHand);
document.getElementById("RichiYakuBuilder").style.display = "block";
document.getElementById("VariableInfo").style.display = "none";
document.getElementsByClassName("tablinks")[0].className += " active";
deleteBtn.addEventListener("click", removeLastTile);

//Global Variables
let counts = {};
let suits = { m: 0, p: 0, s: 0, z: 0 };
let totalPairs = 0;
let totalTriplets = 0;
let totalQuads = 0;
let terminalCount = 0;
let honorCount = 0;
let openHand = false;
let suggestions = [];
const tileHand = [];
let shanten = 0;
let btnContainer = document.getElementById("button-container");
let handContainer = document.getElementById("handTileHere");
const imageLinks = [
  ...pullImages("Man"),
  ...pullImages("Pin"),
  ...pullImages("Sou"),
  ...pullHonorImages()
];

//Helpers
const SUITS = ["m", "p", "s"];
const DRAGONS = ["5z", "6z", "7z"];
const WINDS = ["1z", "2z", "3z", "4z"];

//Suggestion Pass
function detectPotentialHands(tilesArray) {
  //Reset + Set Data
  openHand = document.getElementById("HandCheck").checked;
  resetVariables();
  setVariables(tilesArray);

  //Add Kokushi Musou Check
  //Add Pinfu
  //Add Iipeikou + Ryanpeikou
  //Add IItsu
  //Add Ryuuiisou
  checkToitoi(); //Sankatsu + Suukatsu
  checkFlush();
  checkYakuhai();
  checkYakuhaiPlus();
  checkTanyao();
  checkChanta();
  checkSanshokuDoukou();
  checkSanshokuDoujun();
  checkConcealedTriplets()
  
  //Richi
  if (!openHand) {
    suggestions.push(
      "<b>CLOSED:</b> Riichi: Keep your hand completely closed, focus on standard 1-2-3 runs, and call Riichi once ready."
    );
  }
  checkClosedHand();

  return suggestions;
}

//Yaku Checks----------------------------------
function checkPotentialIipeikou() {
  if (openHand) return;
  for (let suit of SUITS) {
    for (let i = 1; i <= 7; i++) {
      // A sequence can only start from 1 to 7
      let pairRun = 0; // Counts how many tiles in this possible run
      // Check first 3 tiles of the run
      if (hasCopies(i + suit, 2)) pairRun++;
      if (hasCopies(i + 1 + suit, 2)) pairRun++;
      if (hasCopies(i + 2 + suit, 2)) pairRun++;
      if (pairRun >= 2) {
        // If 2 or more tiles in the same run have duplicates,
        suggestions.push(
          "Iipeikou possibility: You have duplicate tiles forming part of the same run. Consider keeping this suit closed."
        );
      }
    }
  }
}

function checkTanyao() {
  let terminalHonor = getOutsideTileCount();
  if (terminalHonor === 0) {
    suggestions.push(
      "All Simples (Tanyao): Your hand has no terminals or honors. Keep 2-8 tiles and avoid outside tiles."
    );
  }
  // Good pivot opportunity
  else if (terminalHonor <= 3) {
    suggestions.push(
      `All Simples (Tanyao): Low terminal/honor count (${terminalHonor}). Consider discarding 1s, 9s, and honors.`
    );
  }
}

function checkChanta() {
  let outsideTiles = getOutsideTileCount();
  let terminalHonorGroups = 0;

  // Count pairs/triplets of outside tiles
  Object.keys(counts).forEach((tile) => {
    let num = tile[0];
    let suit = tile[1];

    if (suit === "z" || num === "1" || num === "9") {
      if (counts[tile] >= 2) terminalHonorGroups++;
    }
  });

  // Honroutou: only terminals/honors
  if (outsideTiles >= 9 && terminalHonorGroups >= 3) {
    suggestions.push(
      "Honroutou potential: Many terminal/honor groups. Consider an all outside triplet hand."
    );
  }

  // Junchan: terminals, no honors
  if (honorCount === 0 && terminalCount >= 6) {
    suggestions.push(
      "Junchan potential: No honors and many terminals. Build every group around 1s and 9s."
    );
  }

  // Chanta: terminals/honors + sequences
  if (outsideTiles >= 6 && terminalHonorGroups >= 1) {
    suggestions.push(
      "Chanta potential: Keep terminals/honors and build sequences containing outside tiles."
    );
  }

  // Tsuuiisou: all honors
  if (honorCount >= 9 && terminalCount <= 3) {
    suggestions.push(
      "Tsuuiisou potential: Honor-only hand. Keep honor pairs and triplets."
    );
  }

  // Chinroutou: all terminals
  if (terminalCount >= 9 && honorCount === 0) {
    suggestions.push(
      "Chinroutou potential: Terminal-only hand. Keep 1s and 9s."
    );
  }
}

function checkConcealedTriplets() {
  // Must be a closed hand
  if (openHand) return;
  // Suuankou: 3 triplets + a pair (or better)
  if (totalTriplets >= 3 && totalPairs >= 1) {
    suggestions.push(
      "Four Concealed Triplets (Suuankou): Rare opportunity! Stay closed and try to complete one more concealed triplet."
    );
  }
  // Sanankou: 2 triplets + a pair
  if (totalTriplets >= 2 && totalPairs >= 1) {
    suggestions.push(
      "Three Concealed Triplets (Sanankou): Keep your hand closed and aim to complete another triplet."
    );
  }
}

// Check 2 matching pairs/triplets across suits or 2 complete triplets
function checkSanshokuDoukou() {
  for (let i = 1; i <= 9; i++) {
    let score = 0;
    if (counts[i + "m"] >= 2) score++;
    if (counts[i + "p"] >= 2) score++;
    if (counts[i + "s"] >= 2) score++;
    if (score >= 2) {
      suggestions.push(
        `Triple Triplets (Sanshoku Doukou): Multiple ${i}'s are forming across suits. Consider keeping pairs and calling Pon if needed to create three pons.`
      );
    }
  }
}

// Easy to build 7+ tiles present worth consiering
function checkSanshokuDoujun() {
  for (let i = 1; i <= 7; i++) {
    let score = 0;
   for (let suit of SUITS) {
      if (counts[i + suit]) score++;
      if (counts[i + 1 + suit]) score++;
      if (counts[i + 2 + suit]) score++;
    }
    if (score >= 7) {
      suggestions.push(
        `Mixed Triple Sequence (Sanshoku Doujun): You're close to matching the ${i}${i + 1}${i + 2} sequence in all three suits.`
      );
    }
  }
}

function checkToitoi() {
  //Toitoi
  if (totalTriplets >= 3 || totalPairs >= 4) {
    //Toitoi
    suggestions.push(
      "All Triplets (Toitoi): Strongly viable. Look to open your hand using 'Pon' when tiles match."
    );
  }
  // Sankantsu / Suukantsu Check
   const totalMeldTriplets = totalTriplets + totalQuads;
    if (totalQuads === 3) {
      suggestions.push(
        "Four Quads (Suukantsu): TENPAI! You have 3 Quads completed. Call 'Kan' on one more set to secure a Yakuman."
      );
    } else if (totalQuads === 2 && totalMeldTriplets >= 3) {
      suggestions.push(
        "Three Quads (Sankantsu): Strongly viable. Hunt down your third Kan. Bonus: Get a fourth Kan for Suukantsu Yakuman!"
      );
}
}

function checkClosedHand() {
  if (!openHand) {
    //Chiitoitsu
    if (totalPairs >= 4) {
      //Chiitoitsu
      suggestions.push(
        "<b>CLOSED:</b> Seven Pairs (Chiitoitsu): Strongly viable. Avoid grouping cards into sequences; hold duplicates."
      );
    }
    //Menzen Tsumo
    if (shanten === 0) {
      suggestions.push(
        "<b>CLOSED:</b> Menzen Tsumo: Your hand is ready. You need to draw the last tile to win ."
      );
    }
  }
}

function checkFlush() {
  let numSuits = ["m", "p", "s"].filter((s) => suits[s] > 0).length;
  if (numSuits === 1) {
    if (suits.z > 0) {
      suggestions.push("Half Flush (Honitsu): Keep your main suit and honors.");
    }
    //Check if suit is green
    else {
      suggestions.push("Full Flush (Chinitsu): Remove other suits. And pick up no honors");
    }
  }
  //Iitsu - check for 1-9 of each suite
}

function checkYakuhai() {
  // Yakuhai Check
   DRAGONS.forEach((dragon) => {
    if (hasCopies(dragon, 3)) {
      suggestions.push(
        `Dragon Value (Yakuhai): You have a triplet of ${getDragonName(dragon)} Dragons for an easy score multiplier.\n`
      );
    }
    else if (hasCopies(dragon, 2)) {
      suggestions.push(
        `Dragon Value (Yakuhai): Hold your pair of ${getDragonName(dragon)} Dragons to complete a triplet.\n`
      );
    }
  });
}

function checkYakuhaiPlus() {
  const dragons = countSets(DRAGONS);
  const winds = countSets(WINDS);

  // Daisangen (Big Three Dragons)
 if (dragons.triplets === 3) {
    suggestions.push(
      "Big Three Dragons (Daisangen): You have all three dragon triplets!"
    );
  }
  // Shousangen (Little Three Dragons)
 else if (dragons.triplets === 2 && dragons.pairs === 1) {
    suggestions.push(
      "Little Three Dragons (Shousangen): Keep your dragon pair to complete the third triplet."
    );
  }
  // Daisuushi (Big Four Winds)
  if (winds.triplets === 4) {
    suggestions.push(
      "Big Four Winds (Daisuushi): You have all four wind triplets!"
    );
  }
  // Shousuushi (Little Four Winds)
  else if (winds.triplets === 3 && winds.pairs === 1) {
    suggestions.push(
      "Little Four Winds (Shousuushi): Keep your wind pair to complete the fourth triplet."
    );
  }
}
//Yaku Checks----------------------------------

//Variable Management
function resetVariables() {
  //Clear it
  document.getElementById("output").innerHTML = "";
  document.getElementById("VariableInfo").innerHTML = "";
  suggestions = [];
  counts = {};
  suits = { m: 0, p: 0, s: 0, z: 0 };
  totalPairs = 0;
  totalTriplets = 0;
  totalQuads = 0;
  terminalCount = 0;
  honorCount = 0;
}

function setVariables(tilesArray) {
  // Map metrics directly to key-value pairs (e.g. counts["1m"] = 3)
  tilesArray.forEach((tile) => {
    counts[tile] = (counts[tile] || 0) + 1;
    const suit = tile[1];
    const num = parseInt(tile[0]);
    suits[suit]++;

    if (suit === "z") {
      honorCount++;
    }
    if (num === 1 || num === 9) {
      terminalCount++;
    }
  });

  // Clear loop that safely iterates flat object keys to find triplets
  Object.keys(counts).forEach((tile) => {
    if (counts[tile] === 2) totalPairs++;
    if (counts[tile] === 3) totalTriplets++;
    if (counts[tile] === 4) totalQuads++;
  });

  // Isolated search copy prevents loop overwrites
  let searchCounts = {
    m: Array(10).fill(0),
    p: Array(10).fill(0),
    s: Array(10).fill(0),
    z: Array(8).fill(0)
  };
  tilesArray.forEach((tile) => {
    const num = parseInt(tile[0]);
    const suit = tile[1];
    if (searchCounts[suit]) searchCounts[suit][num]++;
  });

  let maxSetsAndPairs = 0;
  function analyzeSuit(suitArr, index, sets, pairs) {
    if (index > 9) {
      const currentScore = sets * 2 + pairs;
      if (currentScore > maxSetsAndPairs) maxSetsAndPairs = currentScore;
      return;
    }
    if (suitArr[index] >= 3) {
      suitArr[index] -= 3;
      analyzeSuit(suitArr, index, sets + 1, pairs);
      suitArr[index] += 3;
    }
    if (
      index <= 7 &&
      suitArr[index] > 0 &&
      suitArr[index + 1] > 0 &&
      suitArr[index + 2] > 0
    ) {
      suitArr[index]--;
      suitArr[index + 1]--;
      suitArr[index + 2]--;
      analyzeSuit(suitArr, index, sets + 1, pairs);
      suitArr[index]++;
      suitArr[index + 1]++;
      suitArr[index + 2]++;
    }
    if (suitArr[index] >= 2) {
      suitArr[index] -= 2;
      analyzeSuit(suitArr, index, sets, pairs + 1);
      suitArr[index] += 2;
    }
    analyzeSuit(suitArr, index + 1, sets, pairs);
  }

  ["m", "p", "s", "z"].forEach((suit) => {
    analyzeSuit(searchCounts[suit], 1, 0, 0);
  });

  shanten = Math.min(8 - maxSetsAndPairs, 6 - totalPairs);

  return shanten;
}

// Analyze hand
function analyzeHand() {
  //Set Variables
  const inputType = document.getElementById("typeCheck").checked;
  const tilesArray = [];
  let hand;
  let match;

  if(inputType === true){
    // Turn 123m into 1m 2m 3m
    hand = document.getElementById("handInput").value;
    for (const [_, numbers, suit] of hand.matchAll(/([1-9]+)([mpsz])/g)) {
      for (const num of numbers) {
        tilesArray.push(num + suit);
      }
    }
  }else{
    const hand = document.getElementById("handValueLabel").textContent;
    const tileMap = { 
      man: "m", pin: "p", sou: "s",
      ton: "1z", nan: "2z", shaa: "3z", pei: "4z", // Winds
      haku: "5z", hatsu: "6z", chun: "7z"          // Dragons
    };
    hand.split(",").forEach(tile => {
      // Matches "Man5", "Haku", etc., splitting the word and the optional number
      const match = tile.trim().match(/([a-z]+)(\d)?/i);
      if (!match) return;
      const [_, name, num] = match;
      const key = name.toLowerCase();
      if (tileMap[key]) {
        // If it has a number, append the letter (5m). If not, use the honor code (5z).
        tilesArray.push(num ? num + tileMap[key] : tileMap[key].split('').reverse().join(''));
      }
    });
  }
  
  //Exit if you dont have 13
  if (tilesArray.length !== 13) {
    document.getElementById("output").innerHTML =
      `Error: Enter exactly 13 tiles. This hand has ${tilesArray.length}.`;
    return;
  }

  //Parse Shanten + hand recs
  try {
    shanten = setVariables(tilesArray);
    const handRecommendations = detectPotentialHands(tilesArray);
    //Decide Shanten
    let statusMessage =
      shanten === 0
        ? "Tenpai! Your hand is ready. You just need 1 tile to win.\n"
        : `${shanten}-Shanten. You are ${shanten + 1} tiles away from completing your structure.`;
    
    // Map recommendations out to a bulleted list layout
    const listItems = handRecommendations
      .map((item) => `<br>- ${item}`)
      .join("");
    //Set the output
    document.getElementById("output").innerHTML = `
             <br><b>YAKU OPTIONS</b>
             ${listItems}  <br><br>
              <br><b>SHANTEN:</b>
             ${statusMessage}`;
    //Set the Variables
    document.getElementById("VariableInfo").innerHTML =
      `<br><b>VARIABLE INFO:</b> <br> 
           Parsed: ${JSON.stringify(tilesArray)}<br>
           You entered: ${hand}<br>
           OpenHand? ${openHand}<br>
           Suits:  m(${suits.m})   p(${suits.p})  s(${suits.s})<br>
           TotalPairs:${totalPairs}      Total Triplets:${totalTriplets}   Total Quads:${totalQuads}<br> 
           Terminal Count:${terminalCount}  HonorCount:${honorCount}<br>
           Shanten:${shanten}`;
  } catch (err) {
    document.getElementById("output").innerHTML =
      "Calculation Error: " + err.message;
  }
}

//Tabsystem
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

//Toggle System
function toggleTab() {
  let element = document.getElementById("VariableInfo");
  if (element) {
    if (element.style.display === "block") {
      element.style.display = "none";
    } else {
      element.style.display = "block";
    }
  }
}

//Toggle Visibility
function toggleVisibility(isTrue, targetName) {
  if (isTrue) {
    targetName.style.display = 'block'; // Show
  } else {
    targetName.style.display = 'none';  // Hide
  }
}
const toggle = document.getElementById('typeCheck');
const typeBox = document.getElementById('typeTab');
const tapBox = document.getElementById('tapTab');
toggle.addEventListener('change', function() {
  toggleVisibility(this.checked, typeBox); 
  toggleVisibility(!this.checked, tapBox); 
});
typeBox.style.display = "none";
tapBox.style.display = "block"


//Button Creation---------------------------
//Pull images
function pullImages(type) {
  let arrayLink = [];
  let string =
    "https://github.com/FluffyStuff/riichi-mahjong-tiles/blob/26e127ba2117f45cdce5ea0225748cc0cfad3169/Export/Regular/";
  for (let i = 1; i <= 9; i++) {
    arrayLink.push(string + type + i + ".png?raw=true");
  }
  
  return arrayLink;
}

function pullHonorImages(){
   let arrayLink = [];
   let honorsArray = [ "Ton", "Nan", "Shaa", "Pei", "Haku","Hatsu", "Chun"]
   let string =
    "https://github.com/FluffyStuff/riichi-mahjong-tiles/blob/26e127ba2117f45cdce5ea0225748cc0cfad3169/Export/Regular/";
    honorsArray.forEach((element) => {
    arrayLink.push(string + element + ".png?raw=true");
  });
  
  return arrayLink;
}


function createBtns(goal, container, array) {
  //Fix for pin5-Dora
  //Select the container on the page
  container.replaceChildren();
  array.forEach((url, index) => {
    const btn = document.createElement("button");
    btn.className = "img-btn";
    // Extract the file name to use as accessible alt text for screen readers
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    const img = document.createElement("img");
    let text = fileName.replace(".png?raw=true", "");
    let result = text.replace(/([a-zA-Z]+)(\d+)/, "$2$1"); // returns "1man"
    let finalResult = result.slice(0, 2); // returns "1m"
    img.src = url;
    img.alt = fileName;
    btn.id = result;
    btn.appendChild(img);
    btn.addEventListener("click", () => {
      if (goal === "Add") {
        addTileString(url);
      }
      if (goal === "Remove") {
        removeClickedTile(index);
      }
    });
    container.appendChild(btn);
  });
}
createBtns("Add", btnContainer, imageLinks);
//Button Creation---------------------------


//Tap Tile Functionality---------------------------
//Funciton onclick to add
function addTileString(tile) {
  let dupCheck = ValidateSingleTileMax(tileHand, tile);
  if (tileHand.length < 13 && !dupCheck) {
    tileHand.push(tile);
    const formattedArray = tileHand.map((fileName) => {
    let text = fileName
      .substring(fileName.lastIndexOf("/") + 1)
      .replace(".png?raw=true", "");
    return text;
  });
    document.getElementById("handValueLabel").innerHTML = formattedArray.join();
    createBtns("Remove", handContainer, tileHand);
  } 
}
//BackButton to delete items from queue
function removeLastTile() {
  tileHand.pop();
  createBtns("Remove", handContainer, tileHand);
  const formattedArray = tileHand.map((fileName) => {
    let text = fileName
      .substring(fileName.lastIndexOf("/") + 1)
      .replace(".png?raw=true", "");
    return text;
  });
  document.getElementById("handValueLabel").innerHTML = formattedArray;
}

function removeClickedTile(index) {
  tileHand.splice(index,1);
  createBtns("Remove", handContainer, tileHand);
  const formattedArray = tileHand.map((fileName) => {
    let text = fileName
      .substring(fileName.lastIndexOf("/") + 1)
      .replace(".png?raw=true", "");
    return text;
  });
  document.getElementById("handValueLabel").innerHTML = formattedArray;
}
//Tap Tile Functionality---------------------------


//DupCheck
//checks how many of a given tile  in Hand
function CheckNumberOfTiles(Hand, tile) {
  let NumInHand = 0;
  for (let x of Hand) {
    if (x === tile) {
      NumInHand++;
    }
  }
  return NumInHand;
}
//Checks every tile against every other tile
//returns false if any tile has more than 4 tiles.
//Returns true if 4 or less of any tiles
function ValidateMaxTileLimit(Hand) {
  for (let x of Hand) {
    if (CheckNumberOfTiles(Hand, x) === 4) {
      return false;
    }
  }
  return true;
}

function ValidateSingleTileMax(Hand, Tile) {
  return CheckNumberOfTiles(Hand, Tile) === 4;
}


//Helper Functions
function getOutsideTileCount() {
    return terminalCount + honorCount;
}

function getDragonName(tile) {
    if (tile === "5z") return "White";
    if (tile === "6z") return "Green";
    if (tile === "7z") return "Red";
}

function countSets(tileList) {
    let triplets = 0;
    let pairs = 0;
    tileList.forEach(tile => {
        if (counts[tile] >= 3)
            triplets++;
        else if (counts[tile] === 2)
            pairs++;
    });
    return {
        triplets,
        pairs
    };
}

function hasCopies(tile, amount) {
    return (counts[tile] || 0) >= amount;
}