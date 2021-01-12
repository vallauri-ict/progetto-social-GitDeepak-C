"use strict";

const DBNAME = "DbProgetto";
const http = require("http");
const fs = require("fs");
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");

let mongo = require("mongodb");
let mongoClient = mongo.MongoClient;
const ObjectId = mongo.ObjectID;
const CONNECTIONSTRING = "mongodb+srv://Deepak:Deepak@cluster0.908ca.mongodb.net/test";
const CONNECTIONOPTIONS = { useNewUrlParser: true, useUnifiedTopology: true };

const PORT = 1337;

let paginaErrore;

const server = http.createServer(app);
server.listen(PORT, function () {
    console.log("Server in ascolto sulla porta " + PORT);
    init();
});

app.use(cors());
app.use(express.json({ "limit": "50mb" }));
app.set("json spaces", 4);

function init() {
    fs.readFile("./pagine/error.html", function (err, data) {
        if (!err)
            paginaErrore = data.toString();
        else
            paginaErrore = "<h1>Risorsa non trovata</h1>";
    });
}

//Log della richiesta
app.use('/', function (req, res, next) {
    //originalUrl contiene la risorsa richiesta
    console.log(">>>>>>>>>> " + req.method + ":" + req.originalUrl);
    next();
});

//Route relativa alle risorse statiche
app.use('/', express.static("./pagine"));

//Route di lettura dei parametri post
app.use(bodyParser.urlencoded({ "extended": true }));
app.use(bodyParser.json());

//Log dei parametri
app.use("/", function (req, res, next) {
    if (Object.keys(req.query).length > 0) {
        console.log("Parametri GET: " + JSON.stringify(req.query));
    }
    if (Object.keys(req.body).length > 0) {
        console.log("Parametri BODY: " + JSON.stringify(req.body));
    }
    next();
});

let currentCollection;
let currentId;
app.use("/", function (req, res, next) {
    let aus = req.originalUrl.split("/");
    currentCollection = aus[2];
    currentId = aus[3];
    next();
});

//Route per fare in modo che il server risponda a qualunque richiesta anche extra-domain.
app.use("/", function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
})

/********** Route specifiche **********/
app.get("/api/getPost", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Post");
            collection.find().toArray(function (err, data)
            {
                if (err)
                {
                    console.log("Errore esecuzione query: " + err.message);
                }
                else
                {
                    res.status(200).send(data);
                }
                client.close();
            });
        }
    })
});

/********** Route di gestione degli errori **********/
app.use("/", function (req, res, next) {
    res.status(404);
    if (req.originalUrl.startsWith("/api/")) {
        //res.send('"Risorsa non trovata"'); //non va così bene, perchè content-type viene messo = "text"
        res.json("Risorsa non trovata"); //La serializzazione viene fatta dal metodo json()
        //res.send({"ris":"Risorsa non trovata"});
    }
    else {
        res.send(paginaErrore);
    }
});

app.use(function (err, req, res, next) {
    if (!err.codice) {
        console.log(err.stack);
        err.codice = 500;
        err.message = "Internal Server Error";
    }
    res.status(err.codice);
    res.send(err.message);
})