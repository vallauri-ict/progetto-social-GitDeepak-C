"use strict";

$(document).ready(function (){
    let req = inviaRichiesta("GET", "/api/getPost");
    req.fail(errore);
    req.done(function(data){
        console.log(data);
        let _post = $("<div>");
        _post.addClass("post");
    });  
    
    $("#noLog").on("click", function(){
        let req = inviaRichiesta("POST", "/api/logout");
        req.fail(errore);
        req.done(function(data){
            console.log(data);
        })
    });
});