const mongoose = require("mongoose");

/**
 * This is the schema of the tweet message
 */
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
  com_entities: {
    type: Array,
  },
  com_sentiment: {
    type: Object,
  },
});

module.exports = mongoose.model("tweet", tweetSchema);
