"use strict";

$(document).ready(function (){
    let loggedUser,
        like = true;

    let req = inviaRichiesta("GET", "/api/getPost");
    req.fail(errore);
    req.done(function(data){
        console.log(data);
        for(let item of data){
            let _post = $("<div>"),
                _postInfo = $('<div>'),
                _username = $("<div>"),
                _img =  $("<img>"),
                _postImg = $("<div>"),
                _postIcon = $("<div>");
            _post.addClass("post").appendTo($("#postWrapper"));
            $('<i class="fa fa-user-circle"></i>').css({"float": "left"}).appendTo(_postInfo);
            _username.html(item["idUtente"]);
            _username.appendTo(_postInfo);
            _postInfo.addClass("infoUtente").appendTo(_post);
            _img.attr("src", item["imgPost"]);
            _img.css({"width": "100%", "height": "100%"}).appendTo(_postImg);
            _postImg.addClass("imgPost").appendTo(_post);
            $('<i class="fa fa-heart-o" title="Like"></i>').attr("user", item["idUtente"]).appendTo(_postIcon).on("click", mettiLike);
            $('<i class="fa fa-commenting" title="Comment"></i>').appendTo(_postIcon);
            $('<i class="fa fa-share" title="Share"></i>').appendTo(_postIcon);
            $('<i class="fa fa-bookmark" title="Save Post"></i>').css({"float": "right", "margin-right": "1em", "margin-top": "0.1em"}).appendTo(_postIcon);
            _postIcon.addClass("iconPost").appendTo(_post);
        }
    });
    
    req = inviaRichiesta("GET", "/api/getUsername");
    req.fail(errore);
    req.done(function(data){
        console.log(data);
        loggedUser = data["username"];
    })
    
    $("#noLog").on("click", function(){
        let req = inviaRichiesta("POST", "/api/logout");
        req.fail(errore);
        req.done(function(data){
            console.log(data);
        })
    });

    function mettiLike(){
        let _user = $(this).attr("user");
        if(like)
            $(this).removeClass("fa fa-heart-o").addClass("fa fa-heart");
        else
            $(this).removeClass("fa fa-heart").addClass("fa fa-heart-o");

        let req = inviaRichiesta("POST", "/api/like", {"username": _user ,"like": like});
        req.fail(errore);
        req.done(function(data){console.log(data)});
        like = !like;
    }
});