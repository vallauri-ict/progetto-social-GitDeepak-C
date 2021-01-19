"use strict";

$(document).ready(function (){
    let loggedUser;

    let req = inviaRichiesta("GET", "/api/getUsername");
    req.fail(errore);
    req.done(function(data){
        loggedUser = data["username"];
        let request = inviaRichiesta("POST", "/api/getUserData", {"username": loggedUser});
        request.fail(errore);
        request.done(function(data){
            console.log(data);
            $("#nPost").html(data["nPost"]);
            $("#nFollowers").html(data["nFollowers"]);
            $('#nSeguiti').html(data["nSeguiti"]);
            $('#imgProfile').html("").css({"background": "url(" + data["photoProfile"] + ") no-repeat", "background-size": "cover"});
            $("#username").html(data["username"]);
            let date = new Date(data["dataNascita"]);
            $("#email").html(data["email"]).contentEditable = true;
            $("#dataNascita").html(date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear()).contentEditable = true;
            $("#indirizzo").html(data["indirizzo"]).contentEditable = true;
        })
    });
});