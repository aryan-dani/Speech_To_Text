const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Add error handling for certificate files
let options;
try {
  options = {
    key: fs.readFileSync(path.join(__dirname, "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
  };
} catch (error) {
  console.error("Error loading SSL certificates:", error.message);
  console.log(
    "Make sure key.pem and cert.pem exist in the project root directory"
  );
  process.exit(1);
}

// Change path to dist folder if you're using Angular's default build output
const distPath = path.join(__dirname, "dist/medical-transcription-app");
// If you want to keep using src, comment the line above and uncomment below:
// const distPath = path.join(__dirname, "src/");

// Check if the directory exists
if (!fs.existsSync(distPath)) {
  console.error(`Directory not found: ${distPath}`);
  console.log("Make sure you've built your Angular application");
  process.exit(1);
}

app.use(express.static(distPath));

// Add a health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res
      .status(404)
      .send("index.html not found. Did you build your Angular app?");
  }
});

https.createServer(options, app).listen(PORT, () => {
  console.log(`Server running at https://localhost:${PORT}`);
  console.log(`Serving content from: ${distPath}`);
});
