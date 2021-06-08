"use strict";

const DBNAME = "DbProgetto";
const https = require("https");
const fs = require("fs");
const express = require("express");
const { response } = require('express');
const colors = require('colors');
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const upload = require("./pagine/js/upload/upload");

let mongo = require("mongodb");
let mongoClient = mongo.MongoClient;
const ObjectId = mongo.ObjectID;
const CONNECTIONSTRING = "mongodb+srv://Deepak:Deepak@cluster0.908ca.mongodb.net/test";
const CONNECTIONOPTIONS = { useNewUrlParser: true, useUnifiedTopology: true };

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const PORT = 1337;
const TTL_Token = 500; //espresso in sec 
const SALT_VALUE = 12;
const privateKey = fs.readFileSync("pagine/keys/privateKey.pem", "utf8");
const certificate = fs.readFileSync("pagine/keys/certificate.pem", "utf8");
const credentials = { "key": privateKey, "cert": certificate };
const CLOUDINARY_URL = "cloudinary://727434187412185:tnCdCY_-Gb6HbrRpnPTvUgxIrTM@dct4tjerz";
const CLOUD_NAME = "dct4tjerz";
const API_KEY = "727434187412185";
const API_SECRET = "tnCdCY_-Gb6HbrRpnPTvUgxIrTM";

let paginaErrore,
    username = "",
    users = [],
    oldMessages = [],
    newMessages = [];

const server = https.createServer(credentials, app);
const io = require('socket.io')(server);
const TRANSPORTER = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'gestioneprogettoFG@gmail.com',
        pass: 'FG2021!.'
    }
});
server.listen(PORT, function () {
    console.log("Server in ascolto sulla porta " + PORT);
    // connessione di un client
    // viene inettato 'socket' contenente IP e PORT del client
    io.on('connection', function (socket) {
        let user = {};
        user.username = "";
        user.socket = socket;
        user.socketId = socket.id;
        users.push(user);
        log(' User ' + colors.yellow(socket.id) + ' connected!');
        mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
            if (!err) {
                let db = client.db(DBNAME),
                    collection = db.collection("Messaggi");
                collection.find().toArray(function (err, data) {
                    if (err) {
                        console.log("Errore esecuzione query: " + err.message);
                    }
                    else {
                        oldMessages = data;
                        for (let item of oldMessages) {
                            let m = JSON.stringify({
                                'from': item["from"],
                                'message': item["message"],
                                'date': item["data"]
                            });
                            io.sockets.emit('notify_message', m);
                        }
                    }
                    client.close();
                });
            }
        })


        // 1) ricezione username
        socket.on('username', function (username) {
            for (let user of users) {
                if (this.id == user.socketId) {
                    user.username = username;
                    log(' User ' + colors.yellow(user.socket.id) + ' name is ' + colors.yellow(user.username));
                    console.log();
                }
            }

            if (users.includes(user.username))
                this.join("room1");
            else
                this.join("room2");
        });


        // 2) ricezione di un messaggio	 
        socket.on('message', function (data) {
            for (let user of users) {
                if (this.id == user.socketId) {
                    log('User ' + colors.yellow(user.username) + "-" + colors.white(user.socket.id) + ' sent ' + colors.green(data));
                    // notifico a tutti i socket (compreso il mittente) il messaggio appena ricevuto
                    let m = JSON.stringify({
                        'from': user.username,
                        'message': data,
                        'date': new Date()
                    });
                    io.sockets.emit('notify_message', m);
                    newMessages.push(JSON.parse(m));
                }
            }

            if (users.includes(user.username))
                io.to("room1").emit("notify_message", response);
            else
                io.to("room2").emit("notify_message", response);

            //notifico a tutti i socket(compreso il mittente) il messaggio appena ricevuto
            //io.sockets.emit("notify_message", response);
        });

        // 3) user disconnected
        socket.on('disconnect', function () {
            log(' User ' + user.username + ' disconnected!');
            mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
                if (!err) {
                    let db = client.db(DBNAME),
                        collection = db.collection("Messaggi");
                    collection.insertMany((newMessages), function (err, data) {
                        if (err)
                            console.log("Errore esecuzione query: " + err.message);
                        client.close();
                    });
                }
            })
        });
        init();
    })
});

upload.init(CLOUD_NAME, API_KEY, API_SECRET);

// stampa i log con data e ora
function log(data) {
    console.log(colors.cyan("[" + new Date().toLocaleTimeString() + "]") + ": " + data);
}

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
        if (err) {
            res.status(503).send("Errore di connessione al database");
            log(err.message);
        }
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("Utenti");

            username = req.body.username;
            collection.findOne({ "username": username }, function (err, dbUser) {
                if (err) {
                    res.status(500).send("Internal Error in Query Execution")
                    log(err.message);
                }
                else {
                    if (dbUser == null)
                        res.status(401).send("Username e/o Password non validi");
                    else {
                        //req.body.password --> password in chiaro inserita dall'utente
                        //dbUser.password --> password cifrata contenuta nel DB
                        //Il metodo compare() cifra req.body.password e la va a confrontare con dbUser.password
                        bcrypt.compare(req.body.password, dbUser.password, function (err, ok) {
                            if (err) {
                                res.status(500).send("Internal Error in bcrypt compare");
                                log(err.message);
                            }
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
        if (err) {
            res.status(503).send("Errore di connessione al database")
            log(err.message);
        }
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("Utenti");

            let name = req.body.name,
                surname = req.body.surname,
                telefono = 3333333333,
                email = req.body.email,
                photo = req.body.imgProfile,
                dataNascita = new Date(),
                indirizzo = req.body.address,
                nFollow = 0,
                nSeguiti = 0,
                nPost = 0;

            username = name.toLowerCase() + '.' + surname.toLowerCase();
            const rndPsw = Math.random().toString(36).substr(2, 8);
            let hashPsw = bcrypt.hashSync(rndPsw, SALT_VALUE);
            collection.insertOne(
                {
                    "username": username,
                    "name": name,
                    "surname": surname,
                    "telefono": telefono,
                    "email": email,
                    "password": hashPsw,
                    "photoProfile": photo,
                    "dataNascita": dataNascita,
                    "indirizzo": indirizzo,
                    "nFollowers": nFollow,
                    "nSeguiti": nSeguiti,
                    "nPost": nPost
                }, function (err, data) {
                    if (err) {
                        res.status(500).send("Internal Error in Query Execution")
                        log(err.message);
                    }
                    else {
                        collection.findOne({ "username": username }, function (errore, dbUser) {
                            if (errore) {
                                res.status(500).send("Internal Error in Query Execution");
                                log(errore.message);
                            }
                            else {
                                if (dbUser == null)
                                    res.status(401).send("Username non trovato!!");
                                else {
                                    let token = createToken(dbUser);
                                    writeCookie(res, token);

                                    let mailOptions = {
                                        from: 'gestioneprogettoFG@gmail.com',
                                        to: `${email}`,
                                        subject: 'Registrazione a Facegram',
                                        text: `La tua password è: ${rndPsw}`,
                                        html: `
                                                      <head><link href="https://emoji-css.afeld.me/emoji.css" rel="stylesheet"></head>
                                                      <body>
                                                          <i class="em em-flag-it" aria-role="presentation" aria-label="Italian Flag"></i> Ciao: ${username}<br/>
                                                          <i class="em em-flag-it" aria-role="presentation" aria-label="Italian Flag"></i> La tua password è: ${rndPsw}<br/><br/>
                                                      </body>`
                                    };

                                    TRANSPORTER.sendMail(mailOptions, function (error, info) {
                                        if (error) {
                                            console.log(error);
                                            next(error);
                                        } else {
                                            response.status(200).send({});
                                        }
                                    });

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

app.post('/resetPassword', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database")
            log(err.message);
        }
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("Utenti");

            let email = req.body.email;
            console.log("mail: " + email);
            const rndPsw = Math.random().toString(36).substr(2, 8);
            //console.log("password nuova: " + rndPsw);
            let hashPsw = bcrypt.hashSync(rndPsw, SALT_VALUE);
            console.log("994: reset mail");
            collection.updateOne({ "email": email }, { $set: { "password": hashPsw } }, function (err, data) {
                if (err)
                    console.log("Errore esecuzione query: " + err.message);
                else {
                    let mailOptions = {
                        from: 'gestioneprogettoFG@gmail.com',
                        to: `${email}`,
                        subject: 'Reset password',
                        text: `La tua nuova password è: ${rndPsw}`,
                        html: `
                                      <head><link href="https://emoji-css.afeld.me/emoji.css" rel="stylesheet"></head>
                                      <body>
                                          <i class="em em-flag-it" aria-role="presentation" aria-label="Italian Flag"></i> La tua nuova password è: ${rndPsw}<br/><br/>
                                      </body>`
                    };

                    TRANSPORTER.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                            next(error);
                        } else {
                            response.status(200).send({});
                        }
                    });
                    res.status(200).send(data);
                }
                client.close();
            })
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
        res.status(cod).send(errorMessage);
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
    username = data["username"];
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
            collection.find().toArray(function (err, data) {
                if (err) {
                    console.log("Errore esecuzione query: " + err.message);
                }
                else {
                    res.status(200).send(data);
                }
                client.close();
            });
        }
    })
});

app.get("/api/getUsername", function (req, res, next) {
    let token = readCookie(req);
    if (token == "")
        inviaErrore(req, res, 403, "Token mancante");
    else
        res.send({ "username": username });
})

app.get("/api/getUsers", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Utenti");
            collection.find().toArray(function (err, data) {
                if (err)
                    console.log("Errore esecuzione query: " + err.message);
                else
                    res.status(200).send(data);
                client.close();
            });
        }
    })
})

app.post("/api/getUserData", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Utenti"),
                _user = req.body.username;
            collection.findOne({ "username": _user }, function (err, data) {
                if (err) {
                    console.log("Errore esecuzione query: " + err.message);
                }
                else {
                    res.status(200).send(data);
                }
                client.close();
            });
        }
    })
})

app.post("/api/like", function (req, res, next) {
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
            collection.updateOne({ "idUtente": user }, { $inc: { "nLike": n } }, function (err, data) {
                if (err) {
                    console.log("Errore esecuzione query: " + err.message);
                }
                else {
                    res.status(200).send(data);
                }
                client.close();
            });
        }
    })
})

app.post("/api/commenta", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Post"),
                user = req.body.username;
            collection.updateOne({ "idUtente": user }, { $inc: { "nCommenti": 1 } }, function (err, data) {
                if (err) {
                    console.log("Errore esecuzione query: " + err.message);
                }
                else {
                    res.status(200).send(data);
                }
                client.close();
            });
        }
    })
})

app.post("/api/addPost", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Post"),
                img = req.body.photo,
                desc = req.body.description;

            var count;
            collection.countDocuments(function (err, nRecord) {
                if (err) {
                    console.log("Errore esecuzione query");
                }
                else {
                    count = nRecord;
                    console.log(count);
                    let idPost = "p" + (count + 1);
                    let vet = [];
                    vet.push(img);
                    upload.upload(vet, (result) => {
                        collection.insertOne(
                            {
                                "idPost": idPost,
                                "idUtente": username,
                                "imgPost": result[0],
                                "description": desc,
                                "dataPost": new Date(),
                                "nLike": 0,
                                "nCommenti": 0,
                                "nTags": 0
                            }, function (err, data) {
                                if (err) {
                                    res.status(500).send("Internal Error in Query Execution")
                                    log(err.message);
                                }
                                else {
                                    collection.findOne({ "idPost": idPost }, function (errore, dbPost) {
                                        if (errore) {
                                            res.status(500).send("Internal Error in Query Execution");
                                            log(errore.message);
                                        }
                                        else {
                                            if (dbPost == null)
                                                res.status(401).send("Post non trovato!!");
                                            else {
                                                res.send({ "ris": "ok" });
                                            }
                                        }
                                        client.close();
                                    })
                                }
                            });
                    }, (error) => {
                        console.log(error.message);
                    })
                }
            });
        }
    })
})

app.post("/api/getUserPost", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Post"),
                user = req.body.username;
            collection.find({ "idUtente": user }).toArray(function (err, data) {
                if (err) {
                    console.log("Errore esecuzione query: " + err.message);
                }
                else {
                    res.status(200).send(data);
                }
                client.close();
            });
        }
    })
})

app.post("/api/modifyUserData", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore connessione al DB");
        }
        else {
            let db = client.db(DBNAME),
                collection = db.collection("Utenti"),
                user = req.body.username,
                cell = req.body.id,
                newVal = req.body.nuovoValore;
            switch (cell) {
                case "username":
                    collection.updateOne({ "username": user }, { $set: { "username": newVal } }, function (err, data) {
                        if (err)
                            console.log("Errore esecuzione query: " + err.message);
                        else
                            res.status(200).send(data);
                        client.close();
                    });
                    break;
                case "email":
                    collection.updateOne({ "username": user }, { $set: { "email": newVal } }, function (err, data) {
                        if (err)
                            console.log("Errore esecuzione query: " + err.message);
                        else
                            res.status(200).send(data);
                        client.close();
                    });
                    break;
                case "dataNascita":
                    collection.updateOne({ "username": user }, { $set: { "dataNascita": newVal } }, function (err, data) {
                        if (err)
                            console.log("Errore esecuzione query: " + err.message);
                        else
                            res.status(200).send(data);
                        client.close();
                    });
                    break;
                case "indirizzo":
                    collection.updateOne({ "username": user }, { $set: { "indirizzo": newVal } }, function (err, data) {
                        if (err)
                            console.log("Errore esecuzione query: " + err.message);
                        else
                            res.status(200).send(data);
                        client.close();
                    });
                    break;
            }

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
