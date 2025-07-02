const { exec } = require('child_process');

// Wait a bit for the server to start
setTimeout(() => {
  console.log('Opening Safari...');
  
  // Open Safari with localhost:8080
  exec('open -a Safari http://localhost:8080', (error, stdout, stderr) => {
    if (error) {
      console.error('Error opening Safari:', error);
      return;
    }
    if (stderr) {
      console.error('Safari stderr:', stderr);
      return;
    }
    console.log('Safari opened successfully');
  });
}, 2000); // Wait 2 seconds for server to start 