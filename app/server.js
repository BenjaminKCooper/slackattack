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


// example bot

// botkit controller
const controller = botkit.slackbot({
  debug: false,
});
//


// initialize slackbot

const slackbot = controller.spawn({
  token: process.env.SLACK_BOT_TOKEN,
  // this grabs the slack token we exported earlier
}).startRTM(err => {
  // start the real time message client
  if (err) { throw new Error(err); }
});


const smallTalkPart2 = (response, convo) => {
  const resp = convo.extractResponse('smallTalkResp1');
  if (resp === 'good') {
    convo.say('Yay!! I am so glad to hear.');
  } else {
    convo.say('Oh no!! I am sorry to hear.');
  }
};

const smallTalkPart1 = (response, convo) => {
  const howAreYouResp = { key: 'smallTalkResp1', multiple: false };
  convo.ask('I am doing well, thank you for asking! How are you doing?', () => {
    smallTalkPart2(response, convo);
    convo.next();
  }, howAreYouResp);
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

controller.hears(['sup', 'how are you', 'whats up'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.startConversation(message, smallTalkPart1);
});

controller.hears(['what are you even talking about'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message,
    {
      // text: 'Lots of good options out there, but this seems to be the best bet',
      attachments: [
        {
          title: 'Oh no!! Looks like we are having a bit of a misscommunication...',
          image_url: 'http://img.ifcdn.com/images/b4b49a08ad0d7129ff1f107b2355d5a0ea23f65b66add4cfc6ad3a39df335724_1.jpg',
        },
      ],
    });
});

controller.hears(['help'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.reply(message, 'Here are a few things we can talk about: Your next meal (just some derivation of food/hungry), how your day is going.');
});


controller.hears(['food', 'hungry', 'eat'], ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
  bot.startConversation(message, (resp, convo) => {
    const foodTypeResp = { key: 'foodTypeYelp', multiple: false };
    convo.ask('Yea, I am hungry too!! What type of food tickles your fancy today?', (response) => {
      // askLocation(response, convo);

      // (response, convo) => {
      const yelpLocationResponse = { key: 'yelpLocationResponse', multiple: false };
        // let foodType = convo.extractResponse('foodTypeYelp');
        // convo.say(foodType);
      convo.say(convo.extractResponse('foodTypeYelp'));
      convo.next();

      convo.ask('In what town and state are you looking to eat?',
          // yelpSearch(response, convo);
          () => {
            const foodSearchFINAL = convo.extractResponse('foodTypeYelp');
            const citySearchFINAL = convo.extractResponse('yelpLocationResponse');

            yelp.search({ term: foodSearchFINAL, location: citySearchFINAL, limit: 1 })
            .then((data) => {
              // I learned about the below formatting for attachment messages from: https://github.com/howdyai/botkit#botreply
              bot.reply(message,
                {
                  text: 'Lots of good options out there, but this seems to be the best bet',
                  attachments: [
                    {
                      title: `${data.businesses[0].name}`,
                      title_link: `${data.businesses[0].url}`,
                      text: `${data.businesses[0].snippet_text}`,
                      image_url: `${data.businesses[0].image_url}`,
                    },
                  ],
                });
              // convo.say(data.businesses[0].name); // console.log(data);
            })
            .catch((err) => {
              convo.say('Hmm... could not really find anything...');
            });
            convo.next();


            // convo.next();
          }, yelpLocationResponse);
      convo.next();
    }, foodTypeResp);
    convo.next();
  });
}); // I learned about conversations from the example file "/node_modules/botkit/convo_bot.js".

// prepare webhook
// for now we won't use this but feel free to look up slack webhooks
controller.setupWebserver(process.env.PORT || 3001, (err, webserver) => {
  controller.createWebhookEndpoints(webserver, slackbot, () => {
    if (err) { throw new Error(err); }
  });
});

controller.on('outgoing_webhook', (bot, message) => {
  bot.replyPublic(message,
    {
      // text: 'Lots of good options out there, but this seems to be the best bet',
      attachments: [
        {
          title: 'I AM UP!!!',
          image_url: 'http://imagesmtv-a.akamaihd.net/uri/mgid:file:http:shared:mtv.com/news/wp-content/uploads/2016/07/Gerald-1467390458.gif',
        },
      ],
    });
});
