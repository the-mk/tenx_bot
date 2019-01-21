var Twit = require('twit');
var fs = require('fs');
require('dotenv').config();
var T = new Twit({
  consumer_key: process.env.BOT_CONSUMER_KEY,
  consumer_secret: process.env.BOT_CONSUMER_SECRET,
  access_token: process.env.BOT_ACCESS_TOKEN,
  access_token_secret: process.env.BOT_ACCESS_TOKEN_SECRET
});

var test = false;
var run = 0;

if (test) {
  execute();
} else {
  console.log("Interval run initiated");
  setInterval(function(){
    execute();
  }, 300000); 
}

function execute() {
run = run + 1;
console.log('Run: ' + run);
  reply('@tenxwallet when ?');
  reply('@julianhosp when ?');
  retweet();
}

async function reply(query) {
  let tweets = await getTweets(query);
  let checkedTweets = checkTweets(tweets.data.statuses);
  let replies = await replyToTweets(checkedTweets);
}

function getTweets(query) {
  // Set parameters for the Twitter status query
  var params = {
    q: query,  // REQUIRED
    result_type: 'recent'
  }
  return T.get('search/tweets', params);
}

function checkTweets(tweets) {
  tweetsToReply = [];
  for (tweet in tweets) {
    currentTweet = tweets[tweet];
    if (isTenX(currentTweet.user.id_str) || !(notRepliedYet(currentTweet.id_str))) {continue;}
    if (region = hasCountry(currentTweet.text)) {
      response = '@' + currentTweet.user.screen_name + ' ' + region[1] + ' is ' + isSupported(region) + ' region. Cards are live in Singapore. Q1 2019 cards will ship to APAC, Europe is estimated to be 2019. Rest of the World will follow afterwards. Get involved at https://chat.tenx.tech';
      tweetsToReply[currentTweet.id_str] = response;
    } else if (hasKeyword(currentTweet.text)) {
      response = '@' + currentTweet.user.screen_name + ' ' + 'Cards are live in Singapore. Q1 2019 cards will ship to APAC, Europe is estimated to be 2019. Rest of the World will follow afterwards. Get involved at https://chat.tenx.tech';
      tweetsToReply[currentTweet.id_str] = response;
    }
  }
  return tweetsToReply;
}

async function replyToTweet(tweetID, status) {
  return T.post('statuses/update', {
    status: status,
    in_reply_to_status_id: tweetID,
  }, function (err, data, response) {
    if (err) {
      console.log(err);
    } else {
    }
  });
}

async function replyToTweets(checkedTweets) {
  console.log(checkedTweets);
  newReplied = [];
  for (tweet in checkedTweets) {
    if (newReplied.indexOf(tweet) == '-1') {
      if (await replyToTweet(tweet, checkedTweets[tweet])) {
        newReplied.push(tweet);
        console.log('Reply to Tweet ' + tweet);
      }
    }
  }
  if (newReplied.length) {
    // console.log(newReplied);
    for(var j = 0; j < newReplied.length; j++) {
      var note = ',' + newReplied[j];
      fs.appendFile('repliedTo.txt', note, (err) => {  
        if (err) throw err;
        else {
          console.log('Tweet ' + newReplied[j] + ' successfully written to file.');
        }
      });  
    }
  }
  return newReplied;
}

function notRepliedYet(tweetID) {
  var fs = require('fs');
  var alreadyReplied = fs.readFileSync('repliedTo.txt').toString().split(",");
  return alreadyReplied.indexOf(tweetID) == '-1';
}

function isTenX(userID) {
  return userID == '4585412124';
}

function hasKeyword(tweet) {
  keywords = ['card'];
  for (var i = 0; i < keywords.length; i++) {
    if (tweet.search(new RegExp(keywords[i], "i")) != -1) {
      return true;
    }
  }
  return false;
}

function onlyUnique(value, index, self) { 
  return self.indexOf(value) === index;
}

function isSupported(region) {
  if (region[0] == false) {
    return 'an unsupported';
  } else if (region[0] == true) {
    return 'a supported';
  } else {
    return false;
  }
}

async function checkTweetsFromTenx() {
  var retweets = [];
  await T.get('statuses/user_timeline', { user_id: '4585412124', count: 100, include_rts: false, exclude_replies: true }, function(err, data, response) {
    for (var t =  0; t < data.length; t++) {
      if (hasKeyword(data[t].text) && data[t].retweeted == false) {
        retweets.push(data[t].id_str);
        break;
      }
    }
  });
  return retweets;
}

async function retweet() {
  retweets = await checkTweetsFromTenx();
  // console.log(retweetIDs);
  for (var m = 0; m < retweets.length; m++) {
    T.post('statuses/retweet/:id', { id: retweets[m] }, function (err, data, response) {
      console.log('Retweet of Tweet ' + retweets[m]);
    }); 
  }
};

// Returns 0 (unsupported Country) or 1 (supported Country) and the Countryname as an array, otherwise returns false
function hasCountry(tweet) {
  var supportedCountries = ['UK', 'USA', 'Europe', 'EU', 'Asia', 'Aland Islands','Albania','Algeria','American Samoa','Andorra','Angola','Anguilla','Antarctica','Antigua and Barbuda','Argentina','Armenia','Aruba','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bermuda','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','British Indian Ocean Territory','Brunei Darussalam','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Cape Verde','Cayman Islands','Central African Republic','Chad','Chile','Christmas Island','Cocos (Keeling) Islands','Colombia','Comoros','Congo',    'Congo, The Democratic Republic of','Cook Islands','Costa Rica',"Cote d'Ivoire",'Croatia','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Estonia','Ethiopia','Falkland Islands (Malvinas)','Faroe Islands','Fiji','Finland','France','French Guiana','French Polynesia','Gabon','Gambia','Georgia','Germany','Ghana','Gibraltar','Greece','Greenland','Grenada','Guadeloupe','Guam','Guatemala','Guernsey','Guinea-Bissau','Guinea','Guyana','Haiti','The Vatican','Honduras','Hong Kong','Hungary','Iceland','Ireland','Isle of Man','Israel','Italy','Jamaica','Japan','Jersey','Jordan','Kazakhstan','Kenya','Kiribati','South Korea','Kuwait','Kyrgyzstan','Laos','Latvia','Lesotho','Liberia','Liechtenstein','Lithuania','Luxembourg','Macao','Macedonia','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Martinique','Mauritania','Mauritius','Mayotte','Mexico','Micronesia, Federated States of Micronesia','Moldova','Monaco','Mongolia','Montenegro','Montserrat','Morocco','Mozambique','Namibia','Nauru','Nepal','Netherlands','Netherlands Antilles','New Caledonia','New Zealand','Nicaragua','Niger','Nigeria','Niue','Norfolk Island','Northern Mariana Islands','Norway','Oman','Pakistan','Palau','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Pitcairn','Poland','Portugal','Puerto Rico','Qatar','Romania','Russia','Rwanda','Reunion','Saint Barthelemy','Saint Helena, Ascension and Tristan Da Cunha','Saint Kitts and Nevis','Saint Lucia','Saint Martin','Saint Pierre and Miquelon','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','South Africa','South Georgia and the South Sandwich Islands','Spain','Sri Lanka','Suriname','Svalbard and Jan Mayen','Swaziland','Sweden','Switzerland','Taiwan','Tajikistan','Tanzania, United Republic of Tanzania','Thailand','Timor Leste','Togo','Tokelau','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Turks and Caicos Islands','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Venezuela','Vietnam','Virgin Islands, British','Virgin Islands, U.S.','Wallis and Futuna','Zambia','Zimbabwe'];
  var unsupportedCountries = ['China','India','Indonesia','Afghanistan','Cuba','Eritrea','Iran','Iraq','Kosovo', 'Lebanon','Libya','Myanmar','Northern Cyprus','North Korea','Palestine','Somalia','South Sudan','Sudan','Syria','Yemen'];
  var countries = [unsupportedCountries, supportedCountries];

  for (var c =  0; c < 2; c++) {
    var searchCountries = countries[c];
    //Check if Country is found in the Tweet 
    for (l = 0; l < searchCountries.length; l++) {
      if (tweet.search(new RegExp(searchCountries[l], "i")) != -1) {
        return [c, searchCountries[l]];
      }
    }
  }
  return false;
}

