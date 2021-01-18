"use strict";

$(document).ready(function (){
    let req = inviaRichiesta("GET", "/api/getPost");
    req.fail(errore);
    req.done(function(data){
        console.log(data);
        for(let item of data){
            let _post = $("<div>"),
                _postInfo = $('<div>'),
                _i = $('<i class="fa fa-user"></i>').appendTo(_postInfo),
                _postImg = $("<div>"),
                _postIcon = $("<div>");
            _post.addClass("post").appendTo($("#postWrapper"));
            _postInfo.addClass("infoUtente").appendTo(_post);
            _postImg.addClass("imgPost").css("background-image", 'url(' + item["imgPost"] + ')').after(_postInfo);
            _postIcon.addClass("postIcon").addClass("iconPost").after(_postImg);
        }
    });
    
    req = inviaRichiesta("GET", "/api/getUsername");
    req.fail(errore);
    req.done(function(data){
        console.log(data);
    })
    
    $("#noLog").on("click", function(){
        let req = inviaRichiesta("POST", "/api/logout");
        req.fail(errore);
        req.done(function(data){
            console.log(data);
        })
    });
});