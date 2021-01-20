"use strict";

$(document).ready(function (){
    //logout
    $("#noLog").on("click", function(){
        let req = inviaRichiesta("POST", "/api/logout");
        req.fail(errore);
        req.done(function(data){
            console.log(data);
            window.location = '../index.html';
        })
    });
});