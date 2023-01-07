// Importation des modules
var path = require('path');

//================================================================
//==== Demarrage BD et MQTT =======================
//================================================================
const {main_v0} = require('./node_v0.js');

//====================================
// Utilisation du framework express pour gérér les routes 
const express = require('express');
const app = express();

// et pour permettre de parcourir les body des requetes
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/')));
app.use(function(request, response, next) { //Pour eviter les problemes de CORS/REST
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "*");
    response.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
    next();
});

//================================================================
// Answering GET request on this node ... probably from navigator.
// => REQUETES HTTP reconnues par le Node
//================================================================
    
// Route / => Le node renvoie la page HTML affichant les charts
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/ui_lucioles.html'));
});

// The request contains the name of the targeted ESP !
//     /esp/temp?who=80%3A7D%3A3A%3AFD%3AC9%3A44
// Exemple d'utilisation de routes dynamiques
//    => meme fonction pour /esp/temp et /esp/light
app.get('/esp/:what', function (req, res) {
    // cf https://stackabuse.com/get-query-strings-and-parameters-in-express-js/
    console.log(req.originalUrl);
    
    wh = req.query.who // get the "who" param from GET request
    // => gives the Id of the ESP we look for in the db	
    wa = req.params.what // get the "what" from the GET request : temp or light ?
    
    console.log("\n--------------------------------");
    console.log("A client/navigator ", req.ip);
    console.log("sending URL ",  req.originalUrl);
    console.log("wants to GET ", wa);
    console.log("values from object ", wh);
    
    // Récupération des nb derniers samples stockés dans
    // la collection associée a ce topic (wa) et a cet ESP (wh)
    const nb = 100;
    key = wa;
    //dbo.collection(key).find({who:wh}).toArray(function(err,result) {
    dbo.collection(key).find({who:wh}).sort({_id:-1}).limit(nb).toArray(function(err, result) {
	if (err) throw err;
	console.log('get on ', key, ' for ', wh);
	console.log(result);
	res.json(result.reverse()); // This is the response.
	console.log('end find');
    });
    console.log('end app.get');
});


// The request contains the name of the targeted ESP !
//     /esp/temp?who=80%3A7D%3A3A%3AFD%3AC9%3A44
// Exemple d'utilisation de routes dynamiques
//    => meme fonction pour /esp/temp et /esp/light
app.get('/esps/', function (req, res) {
    // cf https://stackabuse.com/get-query-strings-and-parameters-in-express-js/
    console.log(req.originalUrl);
    
    console.log("\n--------------------------------");
    console.log("A client/navigator ", req.ip);
    console.log("sending URL ",  req.originalUrl);
    console.log("wants to GET ", wa);
    console.log("values from object ", wh);
    
    // Récupération des nb derniers samples stockés dans
    // la collection associée a ce topic (wa) et a cet ESP (wh)
    const nb = 20;
    //dbo.collection(key).find({who:wh}).toArray(function(err,result) {
    dbo.collection("iot").find({}).sort({date:1}).limit(nb).toArray(function(err, result) {
        if (err) throw err;
        console.log(result);
        res.json(result.reverse()); // This is the response.
        console.log('end find');
    });
    console.log('end app.get');
});

//================================================================
//==== Demarrage du serveur Web  =======================
//================================================================
// L'application est accessible sur le port 3000

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
