require("dotenv").config();
const NATS = require("nats");
const chalk = require("chalk");
const Twit = require("twit");
const CronJob = require("cron").CronJob;
//Creating and configuring the twit object
const T = new Twit({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
});

//connecting to the NATS queue
const nc = NATS.connect(process.env.NATS_URL, { json: true });

nc.on("error", (err) => {
  console.log(chalk.red(`Error connecting to the NATS ${err}`));
});

nc.on("connect", () => {
  console.log(chalk.green(`Connected to queue at ${process.env.NATS_URL}`));
});

//Initial date
var DATE_NOW = Date.now();
var a = 1;
//This job will fetch the tweets every 5 minutes and will publish them on the queue
var job = new CronJob(
  "5 * * * * *",
  () => {
    //fetch  tweets from 5 minutes(1 min equals 60000 milliseconds) before
    DATE_NOW = DATE_NOW - 5 * 60000;

    console.log(chalk.yellowBright(`Fetched @ ${new Date(DATE_NOW)}`));
    T.get(
      "search/tweets",
      {
        q: `${process.env.TAG} since:${DATE_NOW}`,
        count: 100,
        tweet_mode: "extended",
      },
      (err, data, response) => {
        if (err) console.log(chalk.red(`Unable to fetch tweets ${err}`));

        //publish all the tweets to the queue
        data.statuses.forEach((status, index) => {
          nc.publish("tweet", status);
        });
      }
    );
    //Update date
    DATE_NOW = Date.now();
  },
  null,
  true
);
job.start();
