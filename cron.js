// Cron job to hit endpoint every 14 minutes to keep backend alive
const cron = require("cron");
const https = require("https");

const backendUrl = "https://pocket-money.onrender.com/health";
const job = new cron.CronJob("*/14 * * * *", function () {
  //This function will be executed every 14 minutes
  console.log("Checking server status...");

  //Perform an HTTPS GET request to hit backend API
  https
    .get(backendUrl, (res) => {
      const { statusCode } = res;

      if (statusCode === 200) {
        console.log("Server is active");
      } else {
        console.error(`Server might be down. Status code: ${statusCode}`);
      }
    })
    .on("error", (err) => {
      console.error("Error during server check:", err.message);
    });
});

//Export the cron job
module.exports = {
  job,
};
