let allData = [];
let isExtracting = false;

function updateTable() {
  const tableDiv = document.getElementById("dataTable");
  if (allData.length === 0) {
    tableDiv.innerHTML = "<p>No data extracted yet.</p>";
    return;
  }

  let tableHTML =
    "<table><tr><th>Value</th><th>Note</th><th>Applies to</th><th>Action</th></tr>";
  allData.forEach((row) => {
    tableHTML += `<tr><td>${row.value || ""}</td><td>${
      row.note || ""
    }</td><td>${row.appliesTo || ""}</td><td>${row.action || ""}</td></tr>`;
  });
  tableHTML += "</table>";
  tableDiv.innerHTML = tableHTML;
}

function addLog(message) {
  console.log(`${new Date().toLocaleTimeString()}: ${message}`);
}

function setExtractionState(extracting) {
  isExtracting = extracting;
  document.getElementById("startExtraction").disabled = extracting;
  document.getElementById("copyTable").disabled = !extracting;
}

document
  .getElementById("startExtraction")
  .addEventListener("click", function () {
    if (isExtracting) return;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0].url.includes("dash.cloudflare.com")) {
        if (tabs[0].url.includes("security/waf/tools")) {
          allData = []; // Reset data
          updateTable();
          setExtractionState(true);
          addLog("Starting extraction...");
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "extract" },
            function (response) {
              if (chrome.runtime.lastError) {
                addLog("Error: " + chrome.runtime.lastError.message);
                setExtractionState(false);
              } else if (response && response.status === "started") {
                addLog("Extraction process initiated in the page.");
              }
            }
          );
        } else {
          addLog(
            "Please navigate to the IP Access Rules page (Security > WAF > Tools)."
          );
        }
      } else {
        addLog("This extension only works on Cloudflare dashboard pages.");
      }
    });
  });

document.getElementById("copyTable").addEventListener("click", function () {
  const tableData = allData
    .map(
      (row) =>
        `${row.value || ""}\t${row.note || ""}\t${row.appliesTo || ""}\t${
          row.action || ""
        }`
    )
    .join("\n");
  navigator.clipboard
    .writeText(tableData)
    .then(() => {
      addLog("Table data copied to clipboard");
    })
    .catch((err) => {
      addLog("Failed to copy table data: " + err);
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateData") {
    allData = allData.concat(request.data);
    updateTable();
    addLog(`Received ${request.data.length} rows. Total: ${allData.length}`);
  } else if (request.action === "extractionComplete") {
    addLog("Extraction complete.");
    setExtractionState(false);
  } else if (request.action === "log") {
    addLog(request.message);
  }
});

// Initial table update and state
updateTable();
setExtractionState(false);
