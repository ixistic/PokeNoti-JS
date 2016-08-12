'use strict';
var express = require('express');
var PokemonGO = require('./poke.io.js');
var app = express();
var nodemailer = require('nodemailer');
var router = express.Router();

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// set the view engine to ejs
app.set('view engine', 'ejs');

var bodyParser = require('body-parser')
app.use(bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use('/sayHello', router);

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', function(req, res) {
  // res.send('Hello World!');
  // ejs render automatically looks in the views folder
  res.render('pages/index');
});

app.post('/submit', function(request, response){
  var lat = request.body.lat;
  var lng = request.body.lng;
  var b = new PokemonGO.Pokeio();
  var location1 = {
      type: 'coords',
      coords: {
        latitude: Number(lat),
        longitude: Number(lng),
        altitude: 0,
      }
  };
  var username1 = process.env.PGO_USERNAME || '';
  var password1 = process.env.PGO_PASSWORD || '';
  var provider1 = process.env.PGO_PROVIDER || 'google';

  b.init(username1, password1, location1, provider1, function(err) {
      if (err) throw err;

      console.log('[i] Current location: ' + b.playerInfo.locationName);
      console.log('[i] lat/long/alt: : ' + b.playerInfo.latitude + ' ' + b.playerInfo.longitude + ' ' + b.playerInfo.altitude);

      b.GetProfile(function(err, profile) {
          if (err) throw err;

          console.log('[i] Username: ' + profile.username);
          console.log('[i] Poke Storage: ' + profile.poke_storage);
          console.log('[i] Item Storage: ' + profile.item_storage);

          var poke = 0;
          if (profile.currency[0].amount) {
              poke = profile.currency[0].amount;
          }

          console.log('[i] Pokecoin: ' + poke);
          console.log('[i] Stardust: ' + profile.currency[1].amount);

          setInterval(function(){
              b.Heartbeat(function(err,hb) {
                  if(err) {
                      console.log(err);
                  }

                  for (var i = hb.cells.length - 1; i >= 0; i--) {
                      if(hb.cells[i].NearbyPokemon[0]) {
                          //console.log(a.pokemonlist[0])
                          var pokemon = b.pokemonlist[parseInt(hb.cells[i].NearbyPokemon[0].PokedexNumber)-1];
                          if(hb.cells[i].NearbyPokemon[0]){
                            console.log('[+] There is a ' + pokemon.name);

                            var transporter = nodemailer.createTransport({
                                service: 'Gmail',
                                auth: {
                                    user: '', // Your email id
                                    pass: '' // Your password
                                }
                            });
                            var text = 'There is a ' + pokemon.name;
                            var mailOptions = {
                                from: 'teeravipark1@gmail.com>', // sender address
                                to: 'teeravipark@gmail.com', // list of receivers
                                subject: 'Catch it', // Subject line
                                text: text //, // plaintext body
                                // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
                            };
                            transporter.sendMail(mailOptions, function(error, info){
                              if(error){
                                  console.log(error);
                                  res.json({yo: 'error'});
                              }else{
                                  console.log('Message sent: ' + info.response);
                                  res.json({yo: info.response});
                              };
                            });
                          }
                          else
                            console.log('[-] Not found pokemon here.');
                      }
                  }
              });
          }, 60000);

      });
  });

});

app.listen(port, function() {
  console.log('Our app is running on http://localhost:' + port);
});
