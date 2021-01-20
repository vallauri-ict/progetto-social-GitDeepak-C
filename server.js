"use strict";

const DBNAME = "DbProgetto";
const https = require("https");
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

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PORT = 1337;
const TTL_Token = 500; //espresso in sec 
const privateKey = fs.readFileSync("pagine/keys/privateKey.pem", "utf8");
const certificate = fs.readFileSync("pagine/keys/certificate.pem", "utf8");
const credentials = { "key": privateKey, "cert": certificate }; 

let paginaErrore,
    username = "";

const server = https.createServer(credentials, app);
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

    app.response.log = function (message) {
        console.log("Errore: " + message);
    }
}

//Log della richiesta
app.use('/', function (req, res, next) {
    //originalUrl contiene la risorsa richiesta
    console.log(">>>>>>>>>> " + req.method + ":" + req.originalUrl);
    next();
});

app.get("/", function (req, res, next) {
    controllaToken(req, res, next);
});

app.get("/index.html", function (req, res, next) {
    controllaToken(req, res, next);
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

//Route per fare in modo che il server risponda a qualunque richiesta anche extra-domain.
app.use("/", function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
})

/********** Middleware specifico relativo a JWT **********/
//Per tutte le pagine su cui si vuole fare il controllo del token, si aggiunge un listener di questo tipo

//Questa route deve essere scritta prima del metodo controllaToken()
app.post('/api/login', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database").log(err.message);
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("Utenti");

            username = req.body.username;
            collection.findOne({ "username": username }, function (err, dbUser) {
                if (err)
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                else {
                    if (dbUser == null)
                        res.status(401).send("Username e/o Password non validi");
                    else {
                        //req.body.password --> password in chiaro inserita dall'utente
                        //dbUser.password --> password cifrata contenuta nel DB
                        //Il metodo compare() cifra req.body.password e la va a confrontare con dbUser.password
                        bcrypt.compare(req.body.password, dbUser.password, function (err, ok) {
                            if (err)
                                res.status(500).send("Internal Error in bcrypt compare").log(err.message);
                            else {
                                if (!ok)
                                    res.status(401).send("Username e/o Password non validi");
                                else {
                                    let token = createToken(dbUser);
                                    writeCookie(res, token);
                                    res.send({ "username": username });
                                }
                            }
                        });
                    }
                }
                client.close();
            })
        }
    });
});

app.post('/api/signUp', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database").log(err.message);
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("Utenti");
            let ts = new Date();

            username = req.body.username;
            let name = req.body.name,
                surname = req.body.surname,
                telefono = 3333333333,
                email = username + "@gmail.com",
                password = req.body.password,
                photo = req.body.imgProfile,
                dataNascita = new Date(),
                indirizzo = req.body.address,
                nFollow = 0,
                nSeguiti = 0,
                nPost = 0,
                regex = new RegExp("^\\$2[ayb]\\$.{56}$"),
                pwd;
                // se la password corrente non è in formato bcrypt
                if (!regex.test(password)) {     
                    pwd = bcrypt.hashSync(password, 10)
                }
            collection.insertOne(
                {   "username": username,
                    "name": name,
                    "surname": surname,
                    "telefono": telefono,
                    "email": email,
                    "password": pwd,
                    "photoProfile": photo,
                    "dataNascita": dataNascita,
                    "indirizzo": indirizzo,
                    "nFollowers": nFollow,
                    "nSeguiti": nSeguiti,
                    "nPost": nPost
                }, function (err, data) {
                if (err)
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                else {
                    collection.findOne({"username": username}, function(errore, dbUser){
                        if(errore)
                            res.status(500).send("Internal Error in Query Execution").log(errore.message);
                        else
                        {
                            if(dbUser == null)
                                res.status(401).send("Username non trovato!!");
                            else{
                                let token = createToken(dbUser);
                                writeCookie(res, token);
                                res.send({ "username": username });
                            }
                        }
                        client.close();
                    })
                }
            });
        }
    });
});

app.post("/api/logout", function (req, res, next) {
    res.set("Set-Cookie", `token="";max-age=-1;path=/;httpsonly=true`);
    res.send({ "ris": "ok" });
});

//Questa route va messa dopo login e logout, ma prima di controllaToken
app.use("/api", function (req, res, next) {
    controllaToken(req, res, next);
});

function controllaToken(req, res, next) {
    let token = readCookie(req);
    if (token == "") {
        inviaErrore(req, res, 403, "Token mancante");
    }
    else {
        jwt.verify(token, privateKey, function (err, payload) {
            if (err) {
                inviaErrore(req, res, 403, "Token scaduto o corrotto");
            }
            else {
                let newToken = createToken(payload);
                writeCookie(res, newToken);
                req.payload = payload; //salvo il payload dentro request in modo che le api successive lo possano leggere e ricavare i dati dell'utente loggato
                next();
            }
        });
    }
}

function inviaErrore(req, res, cod, errorMessage) {
    if (req.originalUrl.startsWith("/api/")) {
        res.status(cod).send(errorMessage).log(err.message);
    }
    else {
        res.sendFile(__dirname + "/pagine/login.html");
    }
}

function readCookie(req) {
    let valoreCookie = "";
    if (req.headers.cookie) {
        let cookies = req.headers.cookie.split(';');
        for (let item of cookies) {
            item = item.split('='); //item = chiave=valore --> split --> [chiave, valore]
            if (item[0].includes("token")) {
                valoreCookie = item[1];
                break;
            }
        }
    }
    return valoreCookie;
}

//data --> record dell'utente
function createToken(data) {
    //sign() --> si aspetta come parametro un json con i parametri che si vogliono mettere nel token
    let json = { //payload
        "_id": data["_id"],
        "username": data["username"],
        "iat": data["iat"] || Math.floor((Date.now() / 1000)),
        "exp": (Math.floor((Date.now() / 1000)) + TTL_Token)
    }
    let token = jwt.sign(json, privateKey);
    console.log(token);
    return token;
}

function writeCookie(res, token) {
    //set() --> metodo di express che consente di impostare una o più intestazioni nella risposta HTTPs
    res.set("Set-Cookie", `token=${token};max-age=${TTL_Token};path=/;httpsonly=true;secure=true`);
}

/**************************************** API DI RISPOSTA ALLE RICHIESTE (DA FARE IN CODA A TUTTE LE ALTRE) ****************************************/
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

app.get("/api/getUsername", function(req, res, next){
    let token = readCookie(req);
    if(token == "")
        inviaErrore(req, res, 403, "Token mancante");
    else
        res.send({"username": username});
})

app.post("/api/getUserData", function(req, res, next){
        mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Utenti"),
                _user = req.body.username;
            collection.findOne({"username": _user}, function (err, data)
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
})

app.post("/api/like", function(req, res, next){
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Post"),
                user = req.body.username,
                like = req.body.like,
                n;
            like ? (n = 1) : (n = -1)
            collection.updateOne({"idUtente": user}, {$inc: {"nLike": n}}, function (err, data)
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
})

app.post("/api/commenta", function(req, res, next){
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Post"),
                user = req.body.username;
            collection.updateOne({"idUtente": user}, {$inc: {"nCommenti": 1}}, function (err, data)
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
})

app.post("/api/modifyUserData", function(req, res, next){
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Utenti"),
                user = req.body.username,
                _id = req.body.id,
                newVal = req.body.nuovoValore;
            collection.updateOne({"username": user}, {$set: {_id: newVal}}, function (err, data)
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
})

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
    console.log(err.stack);
});