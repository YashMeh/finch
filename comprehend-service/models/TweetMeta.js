const mongoose = require("mongoose");

const tweetSchema = new mongoose.Schema({
  created_at: {
    type: String,
  },
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
  },
  hashtags: {
    type: Array,
  },
  user_mentions: {
    type: Array,
  },
  lang: {
    type: String,
  },
  user: {
    type: Object,
  },
  retweet_count: {
    type: Number,
  },
  entities: {
    type: Array,
  },
  sentiment: {
    type: Object,
  },
});

module.exports = mongoose.model("tweet", tweetSchema);