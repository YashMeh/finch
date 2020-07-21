require("dotenv").config();
const NATS = require("nats");
const chalk = require("chalk");
const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const middlewares = require("./middlewares");
const Tweet = require("./models/TweetMeta");
const app = express();

/**
 * Using
 * morgan as logger(logging only during dev)
 * helmet for security
 * cors for allowing cross-region requests
 */
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
app.use(helmet());
app.use(cors());
app.use(express.json());
//configuring the mongoose instance
mongoose
  .connect(process.env.dbURI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log(chalk.green("Database Connected"));
  })
  .catch((err) => {
    throw err;
  });

if (process.env.NODE_ENV !== "test") {
  //configuring the AWS environment
  AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS,
    region: "us-east-1",
  });
  //connecting to the NATS queue
  const nc = NATS.connect(process.env.NATS_URL, { json: true });
  const comprehend = new AWS.Comprehend({ apiVersion: "2017-11-27" });

  nc.on("error", (err) => {
    console.log(chalk.red(`Error connecting to the NATS ${err}`));
  });

  nc.on("connect", () => {
    console.log(
      chalk.green(
        `Comprehend Service Connected to queue at ${process.env.NATS_URL}`
      )
    );
  });
  //Languages supported by aws comprehend
  const langComprehend = [
    "de",
    "en",
    "es",
    "it",
    "pt",
    "fr",
    "ja",
    "ko",
    "hi",
    "ar",
    "zh",
    "zh-TW",
  ];
  //subscribing on twitter endpoint
  nc.subscribe("tweet", function (msg) {
    var { created_at, id_str, user, lang, retweet_count } = msg;
    var { hashtags, user_mentions } = msg.entities;
    var TweetObj = {
      created_at,
      id: id_str,
      user,
      lang,
      retweet_count,
      hashtags,
      user_mentions,
    };

    //console.log(msg);
    if (msg.hasOwnProperty("retweeted_status")) {
      console.log("Received a retweet");
      //console.log(msg.retweeted_status.full_text);
      var params = {
        LanguageCode:
          TweetObj.lang in langComprehend
            ? TweetObj.lang
            : "en" /* required - other option is es */,
        Text: msg.retweeted_status.full_text,
      };
      TweetObj.text = msg.retweeted_status.full_text;
    } else {
      console.log("Received an original tweet");
      //console.log(msg.full_text);
      var params = {
        LanguageCode:
          TweetObj.lang in langComprehend
            ? TweetObj.lang
            : "en" /* required - other option is es if not supported run for english*/,
        Text: msg.full_text,
      };
      TweetObj.text = msg.full_text;
    }
    //Detect entities present in the tweet
    comprehend.detectEntities(params, (err, processedData) => {
      if (err) console.log(err, err.stack);
      //console.log(processedData);
      TweetObj.com_entities = processedData.Entities;
      //Detect sentiment of the tweet
      comprehend.detectSentiment(params, (err, processedData2) => {
        if (err) console.log(err, err.stack);
        TweetObj.com_sentiment = processedData2;
        //console.log(TweetObj);
        Tweet.create(TweetObj)
          .then((response) => {
            console.log(chalk.blueBright("Inserted to DB"));
          })
          .catch((err) => {
            throw err;
          });
      });
    });
  });
}
//setting the endpoint
app.get("/api/v1", (req, res) => {
  Tweet.find({}).then((response) => {
    res.json({ data: response, status: 200 });
  });
});
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

const PORT = process.env.port || 5000;
app.listen(PORT, (err) => {
  if (err) throw err;
  console.log(chalk.greenBright(`server running at port ${PORT}`));
});

module.exports = app;
