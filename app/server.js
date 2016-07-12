import botkit from 'botkit';
require('dotenv').config(); // I struggled to get my environmental variables working correctly, so I went with the dotenv method of importing instead.

// I learned about the Yelp API from the following link: https://github.com/olalonde/node-yelp .
const Yelp = require('yelp');

const yelp = new Yelp({
  consumer_key: process.env.YELP_CONSUMER_KEY,
  consumer_secret: process.env.YELP_CONSUMER_SECRET,
  token: process.env.YELP_TOKEN,
  token_secret: process.env.YELP_TOKEN_SECRET,
});

const yelpSearch = (response, convo) => {
  let foodSearchFINAL = convo.extractResponse('foodTypeYelp');
  let citySearchFINAL = convo.extractResponse('yelpLocationResponse');
  yelp.search({ term: foodSearchFINAL, location: citySearchFINAL })
  .then((data) => {
    convo.say(data.businesses[0].name); // console.log(data);
  })
  .catch((err) => {
    convo.say('Hmm... could not really find anything...');
  });
};

// example bot

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});

// initialize slackbot

const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});

const askWhatFoodType = (response, convo) => {
  const foodTypeResp = { key: 'foodTypeYelp', multiple: false };
  convo.ask('Yea, I am hungry too!! What type of food tickles your fancy today?', () => {
    convo.say('Awesome.');
    askLocation(response, convo);
    convo.next();
  }, foodTypeResp);
};

const askLocation = (response, convo) => {
  const yelpLocationResponse = { key: 'yelpLocationResponse', multiple: false };
  // let foodType = convo.extractResponse('foodTypeYelp');
  // convo.say(foodType);
  convo.say(convo.extractResponse('foodTypeYelp'));

  convo.ask('In what town and state are you looking to eat?', () => {
    yelpSearch(response, convo);
    convo.next();
  }, yelpLocationResponse);
  // yelpSearch(response, convo);
};


// example hello response
controller.hears(['hello', 'hi', 'howdy'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.api.users.info({ user: message.user }, (err, res) => {
    if (res) {
      bot.reply(message, `Hello, ${res.user.name}!`);
    } else {
      bot.reply(message, 'Hello there!');
    }
  });
});

controller.hears(['food', 'hungry', 'eat'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.startConversation(message, askWhatFoodType); // I learned about conversations from the example file "/node_modules/botkit/convo_bot.js".
});

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});
