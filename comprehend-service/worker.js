require("dotenv").config();
const NATS = require("nats");
const chalk = require("chalk");
const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const Tweet = require("./models/TweetMeta");
//configuring the AWS environment
AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS,
  region: "us-east-1",
});
//docker uri- "mongodb://mongo:27017/finch";
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
      LanguageCode: "en" /* required - other option is es */,
      Text: msg.retweeted_status.full_text,
    };
    TweetObj.text = msg.retweeted_status.full_text;
  } else {
    console.log("Received an original tweet");
    //console.log(msg.full_text);
    var params = {
      LanguageCode: "en" /* required - other option is es */,
      Text: msg.full_text,
    };
    TweetObj.text = msg.full_text;
  }
  comprehend.detectEntities(params, (err, processedData) => {
    if (err) console.log(err, err.stack);
    //console.log(processedData);
    TweetObj.entities = processedData.Entities;
    comprehend.detectSentiment(params, (err, processedData2) => {
      if (err) console.log(err, err.stack);
      TweetObj.sentiment = processedData2;
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
