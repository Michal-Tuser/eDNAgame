let waterData = {};
let currentCodes = [];
let lang = document.documentElement.lang || 'en';
let speciesSet = new Set();

const speciesList = []; // Final list of all unique species across water types

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Script started (lang:", lang, ")");

  fetch('data.json')
    .then(res => {
      console.log("Fetch status:", res.status);
      if (!res.ok) throw new Error("Failed to fetch data.json");
      return res.json();
    })
    .then(data => {
      console.log("✅ JSON loaded:", data);
      waterData = data;
      buildFullSpeciesList(data);
      createWaterButtons(Object.keys(data));
    })
    .catch(err => {
      console.error("❌ Fetch failed:", err);
      document.getElementById('buttons-container').innerHTML =
        '<p style="color:red;">Failed to load data.json</p>';
    });
});

function buildFullSpeciesList(data) {
  speciesSet.clear();
  Object.values(data).forEach(source => {
    source.codes.forEach(entry => {
      if (entry.species && entry.species[lang]) {
        speciesSet.add(entry.species[lang]);
      }
    });
  });
  speciesList.length = 0;
  speciesList.push(...Array.from(speciesSet).sort());
}

function createWaterButtons(sources) {
  const container = document.getElementById("buttons-container");
  container.innerHTML = "";
  sources.forEach(source => {
    const btn = document.createElement("button");
    const label = waterData[source].title[lang] || capitalize(source);
    btn.textContent = label;
    btn.onclick = () => showResult(source);
    container.appendChild(btn);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showResult(source) {
  const data = waterData[source];
  document.getElementById("result-title").textContent = data.title[lang];

  const container = document.getElementById("code-container");
  container.innerHTML = "";
  currentCodes = data.codes;

  currentCodes.forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "code-item";

    const label = document.createElement("label");
    label.textContent = entry.code;

    const select = document.createElement("select");
    select.id = `select-${index}`;

    const defaultOption = document.createElement("option");
    defaultOption.textContent = lang === 'cz' ? "--Vyberte druh--" : "--Select species--";
    defaultOption.value = "";
    select.appendChild(defaultOption);

    speciesList.forEach(species => {
      const option = document.createElement("option");
      option.value = species;
      option.textContent = species;
      select.appendChild(option);
    });

    const resultSpan = document.createElement("span");
    resultSpan.id = `result-${index}`;
    resultSpan.style.marginLeft = "10px";

    div.appendChild(label);
    div.appendChild(select);
    div.appendChild(resultSpan);
    container.appendChild(div);
  });

  document.getElementById("result-container").style.display = "block";
}

function checkAnswers() {
  currentCodes.forEach((entry, index) => {
    const correct = entry.species[lang];
    const selected = document.getElementById(`select-${index}`).value;
    const resultSpan = document.getElementById(`result-${index}`);
    if (selected === correct) {
      resultSpan.textContent = "✅ " + (lang === 'cz' ? "Správně" : "Correct");
      resultSpan.style.color = "green";
    } else {
      resultSpan.textContent = "❌ " + (lang === 'cz' ? "Špatně" : "Wrong");
      resultSpan.style.color = "red";
    }
  });
}
