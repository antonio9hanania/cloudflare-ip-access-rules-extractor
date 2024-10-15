function extractTableData() {
  const rows = document.querySelectorAll('[role="row"]');
  const tableData = [];
  rows.forEach((row, index) => {
    try {
      const cells = row.querySelectorAll('[role="cell"]');
      if (cells.length < 3) {
        console.warn(`Row ${index} has fewer cells than expected. Skipping.`);
        return;
      }
      const valueCell = cells[0].querySelector("div > div > div");
      if (!valueCell) {
        console.warn(
          `Row ${index} is missing the expected value cell structure. Skipping.`
        );
        return;
      }

      let extractedValue = null;
      let extractedNote = null;

      if (valueCell) {
        const innerDiv = valueCell.firstElementChild;
        console.log("innerDiv:", innerDiv);

        if (innerDiv) {
          // Extract the first value (IP or similar)
          const textNodes = Array.from(innerDiv.childNodes).filter(
            (node) => node.nodeType === Node.TEXT_NODE
          );
          if (textNodes.length > 0) {
            extractedValue = textNodes[0].textContent.trim();
          }

          // Extract the note (second value)
          const noteDiv = innerDiv.querySelector("div");
          if (noteDiv) {
            extractedNote = noteDiv.textContent.trim();
          }
        }
      }

      // Extract "Applies to"
      const appliesTo = cells[1].textContent.trim();
      // Extract Action
      const actionButton = cells[2].querySelector("button");
      const action = actionButton ? actionButton.textContent.trim() : "";
      tableData.push({
        value: extractedValue,
        note: extractedNote,
        appliesTo,
        action,
      });
    } catch (error) {
      console.error(`Error processing row ${index}:`, error);
      chrome.runtime.sendMessage({
        action: "log",
        message: `Error processing row ${index}: ${error.message}`,
      });
    }
  });
  return tableData;
}

function clickNextButton() {
  const nextButton = document.querySelector(
    'button[data-testid="undefined-next-page"]'
  );
  if (nextButton && !nextButton.disabled) {
    nextButton.click();
    return true;
  }
  return false;
}

async function extractAllPagesData() {
  let pageNumber = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    chrome.runtime.sendMessage({
      action: "log",
      message: `Processing page ${pageNumber}...`,
    });

    // Wait for page to load
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const pageData = extractTableData();
    chrome.runtime.sendMessage({ action: "updateData", data: pageData });

    hasNextPage = clickNextButton();

    if (hasNextPage) {
      pageNumber++;
    } else {
      chrome.runtime.sendMessage({ action: "extractionComplete" });
    }
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "extract") {
    console.log("Received extract message in content script");
    extractAllPagesData();
    sendResponse({ status: "started" });
    return true; // Indicates that the response is sent asynchronously
  }
});

console.log("Cloudflare IP Access Rules Extractor content script loaded.");
