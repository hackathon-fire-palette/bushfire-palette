// pages/api/stream-sse.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { chunkSize = 1000, startIndex = 0 } = req.query;
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'data.json');
    const allData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let index = parseInt(startIndex);
    const size = parseInt(chunkSize);
    
    const sendChunk = () => {
      if (index >= allData.length) {
        res.write('event: complete\n');
        res.write('data: {"message": "Stream complete"}\n\n');
        res.end();
        return;
      }
      
      const chunk = allData.slice(index, index + size);
      const chunkData = {
        data: chunk,
        index: Math.floor(index / size),
        total: allData.length,
        isLast: index + size >= allData.length
      };
      
      res.write('event: chunk\n');
      res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
      
      index += size;
      setTimeout(sendChunk, 100); // Adjust delay as needed
    };
    
    sendChunk();
  } catch (error) {
    res.write('event: error\n');
    res.write(`data: ${JSON.stringify({ error: 'Failed to read data' })}\n\n`);
    res.end();
  }
}

// Client-side SSE reader
function createDataStream(onChunk, onComplete, onError) {
  const eventSource = new EventSource('/api/stream-sse?chunkSize=1000');
  
  eventSource.addEventListener('chunk', (event) => {
    const chunkData = JSON.parse(event.data);
    onChunk(chunkData);
  });
  
  eventSource.addEventListener('complete', () => {
    eventSource.close();
    onComplete();
  });
  
  eventSource.addEventListener('error', (error) => {
    eventSource.close();
    onError(error);
  });
  
  return eventSource; // Return for manual closing if needed
}

// Usage example
function startDataStream() {
  let allData = [];
  
  const eventSource = createDataStream(
    // On chunk received
    (chunkData) => {
      console.log(`Received chunk ${chunkData.index + 1}`);
      allData.push(...chunkData.data);
      
      // Update progress
      updateProgress(allData.length, chunkData.total);
    },
    // On complete
    () => {
      console.log('Stream complete!', allData.length, 'items loaded');
      processCompleteData(allData);
    },
    // On error
    (error) => {
      console.error('Stream error:', error);
    }
  );
  
  // Optional: Stop streaming manually
  // eventSource.close();
}