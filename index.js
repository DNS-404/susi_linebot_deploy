'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
var request = require("request");
var http = require('http');

// create LINE SDK config from env variables

const config = {
   channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
   channelSecret: process.env.CHANNEL_SECRET
};

// create LINE SDK client

const client = new line.Client(config);


// create Express app
// about Express: https://expressjs.com/

const app = express();

// register a webhook handler with middleware

app.post('/webhook', line.middleware(config), (req, res) => {
   Promise
       .all(req.body.events.map(handleEvent))
       .then((result) => res.json(result))
       .catch((err) => {
        console.error(err);
        res.status(500).end();
      });
});

// event handler

function handleEvent(event) {
   if (event.type !== 'message' || event.message.type !== 'text') {
       // ignore non-text-message event
       return Promise.resolve(null);
   }

   var options = {
       method: 'GET',
       url: 'https://api.susi.ai/susi/chat.json',
       qs: {
           timezoneOffset: '-330',
           q: event.message.text
       }
   };

   request(options, function(error, response, body) {
       if (error) throw new Error(error);
       // answer fetched from susi
       //console.log(body);
       var ans = (JSON.parse(body)).answers[0].actions[0].expression;

       // create a echoing text message
       if((JSON.parse(body)).answers[0].data[0].type === 'photo'){
        const answer = {
          type: 'image',
          originalContentUrl: ans,
          previewImageUrl: ans
        }
       } else {
        const answer = {
           type: 'text',
           text: ans
        };
       }
       
       // use reply API

       return client.replyMessage(event.replyToken, answer);
   })
}

setInterval(function() {
        http.get(process.env.HEROKU_URL);
    }, 600000); // every 10 minutes

// listen on port

const port = process.env.PORT || 3000;
app.listen(port, () => {
   console.log(`listening on ${port}`);
});
