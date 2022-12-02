import fs from "fs";
import jsdom from "jsdom";
import cron from "node-cron";
import fetch from "node-fetch";
import path from "node:path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAIN_URL = "https://specials.kill-them-all.de/xmas2022/";

// Load html from url and parse if using jsdom
const getHtml = async (url) => {
  const data = await fetch(url).then((res) => res.text());
  const { window } = new jsdom.JSDOM(data);
  return window.document;
};

// Get current link href (class "today") and return full URL
const getTodaysURL = (doc) => {
  const today = doc.querySelector(".today a");
  const href = today.getAttribute("href");
  return new URL(href, MAIN_URL).href;
};

// Download file from URL and save it in the download directory
const downloadFile = async (url) => {
  const res = await fetch(url);
  const filename = res.headers
    .get("content-disposition")
    .split("=")[1]
    .replace(/"/g, "")
    .trim();
  const downloadPath = path.join(__dirname, "download", filename);

  // Check if file exists and is larger than 5 MB
  if (fs.existsSync(downloadPath) && fs.statSync(downloadPath).size > 5e6) {
    console.log("File already exists:", filename);
    return;
  }

  const fileStream = fs.createWriteStream(downloadPath);

  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", () => {
      // Delete file if download fails
      fs.unlink(downloadPath, () => {
        if (err) throw err;
        reject();
      });
    });
    fileStream.on("finish", () => {
      console.log("Successfully downloaded:", filename);
      resolve();
    });
  });
};

const main = async () => {
  console.log("Fetching main page: ", MAIN_URL);
  const doc = await getHtml(MAIN_URL);
  console.log("Getting todays URL");
  const todaysURL = getTodaysURL(doc);
  console.log("Downloading file: ", todaysURL);
  await downloadFile(todaysURL);
};

// Run the main function every day at 8am and 8pm using node-cron
cron.schedule("0 8,20 * * *", () => {
  console.log("Starting job");
  main();
  console.log("Job completed");
});

console.log(
  `Started script at ${new Date().toLocaleString()} and will run every day at 8am and 8pm`
);
