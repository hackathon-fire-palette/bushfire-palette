// Example 1: Simple pagination
async function loadDataByPages() {
  let page = 1;
  let hasMore = true;
  let allData = [];
  
  while (hasMore) {
    try {
      const response = await fetch(`/api/data?page=${page}&limit=100`);
      const result = await response.json();
      
      allData.push(...result.data);
      hasMore = result.pagination.hasNext;
      page++;
      
      console.log(`Loaded page ${page - 1}, total items: ${allData.length}`);
      
      // Optional: Process data as you load it
      processChunk(result.data);
      
    } catch (error) {
      console.error('Error loading page:', page, error);
      break;
    }
  }
  
  return allData;
}

// Example 2: Server-Sent Events streaming
function streamDataWithSSE() {
  const eventSource = new EventSource('/api/stream-sse?chunkSize=500');
  let receivedData = [];
  
  eventSource.addEventListener('chunk', (event) => {
    const chunkData = JSON.parse(event.data);
    
    console.log(`Chunk ${chunkData.index + 1} received:`, chunkData.data.length, 'items');
    receivedData.push(...chunkData.data);
    
    // Update your UI here
    updateUI(chunkData.data);
    updateProgress(receivedData.length, chunkData.total);
  });
  
  eventSource.addEventListener('complete', () => {
    console.log('Streaming complete! Total items:', receivedData.length);
    eventSource.close();
    onStreamComplete(receivedData);
  });
  
  eventSource.addEventListener('error', (error) => {
    console.error('Streaming error:', error);
    eventSource.close();
  });
  
  return eventSource;
}

// Example 3: Fetch with async iteration
async function streamDataWithFetch() {
  const response = await fetch('/api/stream-data?chunkSize=1000');
  
  if (!response.body) {
    throw new Error('ReadableStream not supported');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let allData = [];
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          const chunk = JSON.parse(line);
          
          console.log(`Processing chunk ${chunk.index + 1}`);
          allData.push(...chunk.data);
          
          // Process chunk immediately
          await processChunk(chunk.data);
          
          if (chunk.isLast) {
            console.log('All chunks processed!');
            return allData;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  return allData;
}

// Helper functions
function updateUI(chunkData) {
  // Update your DOM with new data
  const container = document.getElementById('data-container');
  chunkData.forEach(item => {
    const element = document.createElement('div');
    element.textContent = JSON.stringify(item);
    container.appendChild(element);
  });
}

function updateProgress(current, total) {
  const percentage = Math.round((current / total) * 100);
  console.log(`Progress: ${current}/${total} (${percentage}%)`);
  
  // Update progress bar
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
}

function processChunk(data) {
  // Process each chunk of data as needed
  data.forEach(item => {
    // Your processing logic here
  });
}

function onStreamComplete(allData) {
  console.log('Stream finished, final processing...');
  // Final processing when all data is loaded
}

// Usage examples:
// loadDataByPages().then(data => console.log('All data loaded:', data.length));
// const eventSource = streamDataWithSSE();
// streamDataWithFetch().then(data => console.log('Stream complete:', data.length));