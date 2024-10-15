// Function to extract table data
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
      const valueCell = cells[0].querySelector('div > div > div');
      if (!valueCell) {
        console.warn(`Row ${index} is missing the expected value cell structure. Skipping.`);
        return;
      }
      const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
      const match = valueCell.textContent.match(ipRegex);
      const value = match ? match[1] : '';
      const appliesTo = cells[1].textContent.trim();
      const actionButton = cells[2].querySelector('button');
      const action = actionButton ? actionButton.textContent.trim() : '';
      tableData.push({ value, appliesTo, action });
    } catch (error) {
      console.error(`Error processing row ${index}:`, error);
    }
  });
  return tableData;
}

// Function to format the table data as a string
function formatTableData(data) {
  let output = 'Value | Applies to | Action\n';
  output += '--- | --- | ---\n';
  data.forEach(row => {
    output += `${row.value} | ${row.appliesTo} | ${row.action}\n`;
  });
  return output;
}

// Function to click the "Next" button and return whether it was successful
function clickNextButton() {
  const nextButton = document.querySelector('button[data-testid="undefined-next-page"]');
  if (nextButton && !nextButton.disabled) {
    nextButton.click();
    return true;
  }
  return false;
}

// Function to wait for a specified number of milliseconds
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to extract data from all pages
async function extractAllPagesData() {
  let allData = [];
  let pageNumber = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    console.log(`Processing page ${pageNumber}...`);
    
    // Wait 3 seconds for the page to load/render
    await wait(3000);
    
    console.log(`Extracting data from page ${pageNumber}...`);
    const pageData = extractTableData();
    
    console.log(`Data from page ${pageNumber}:`, pageData);
    
    allData = allData.concat(pageData);
    
    console.log('Cumulative data so far:', allData);
    
    hasNextPage = clickNextButton();
    
    if (hasNextPage) {
      console.log('Moving to the next page...');
      pageNumber++;
    } else {
      console.log('Reached the last page. Extraction complete.');
    }
  }

  return allData;
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "extract") {
    extractAllPagesData().then(finalData => {
      console.log('Extraction from all pages complete.');
      console.log('Final dataset:', finalData);
      
      const formattedData = formatTableData(finalData);
      
      // Copy to clipboard
      navigator.clipboard.writeText(formattedData).then(() => {
        console.log('Full formatted dataset copied to clipboard');
        alert('IP Access Rules extracted and copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Extraction complete, but failed to copy to clipboard. Check console for data.');
      });
    }).catch(error => {
      console.error('An error occurred during extraction:', error);
      alert('An error occurred during extraction. Check console for details.');
    });
  }
});

console.log('Cloudflare IP Access Rules Extractor is ready.');
