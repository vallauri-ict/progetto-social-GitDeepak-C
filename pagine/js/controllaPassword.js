app.post('/api/login', function(req, res, next) {
    MONGO_CLIENT.connect(STRING_CONNECT, PARAMETERS, function(err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db('DBmail');
            const collection = db.collection('mail');

            let username = req.body.username;
            collection.findOne({ "username": username }, function(err, dbUser) {
                if (err)
                    res.status(500).send("Internal Error in Query Execution");
                else {
                    if (dbUser == null)
                        res.status(401).send("Username or Password non validi");
                    else {
                        bcrypt.compare(req.body.password, dbUser.password, function(err, ok) {
                            if (err)
                                res.status(500).send("Internal Error in bcrypt compare");
                            else {
                                if (!ok)
                                    res.status(401).send("Username or Password non validi");
                                else {
                                    var token = createToken(dbUser);                                  
                                    writeCookie(res, token)
                                    res.send({ "ris": "ok" });
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