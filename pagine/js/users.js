"use strict";

$(document).ready(function (){
    let req = inviaRichiesta("GET", "/api/getUsers");
    req.fail(errore);
    req.done(function(data){
        console.log(data);
        for(let item of data){
            let _postWrapper = $('<div id="postWrapper"></div>').appendTo($("#sectionUsers"));
            $('<div id="imgProfile">').css({"background": "url(" + item["photoProfile"] + ") no-repeat", "background-size": "cover"}).appendTo(_postWrapper);
            let _info = $('<div id="info"></div>').appendTo(_postWrapper),
                _lblNpost = $('<label>').appendTo(_info),
                _lblNFollow = $('<label>').appendTo(_info),
                _lblNSeguiti = $('<label>').appendTo(_info);
            $('<p id="nPost" class="cont">').html(item["nPost"]).appendTo(_lblNpost);
            $('<p>Post</p>').appendTo(_lblNpost);
            $('<p id="nFollowers" class="cont">').html(item["nFollowers"]).appendTo(_lblNFollow);
            $('<p>Followers</p>').appendTo(_lblNFollow);
            $('<p id="nSeguiti" class="cont">').html(item["nSeguiti"]).appendTo(_lblNSeguiti);
            $('<p>Seguiti</p>').appendTo(_lblNSeguiti);
            let _divUsername = $('<div id="divUsername"></div>');
            $('<p id="username">').html(item["username"]).appendTo(_divUsername);
            _divUsername.appendTo(_postWrapper);
            let _desc = $('<div id="desc"></div>').appendTo(_postWrapper);
            $('<p id="nome">').html(item["name"]).appendTo(_desc);
            $('<p id="surname">').html(item["surname"]).appendTo(_desc);
            $('<p id="email">').html(item["email"]).appendTo(_desc);
            let date = new Date(item["dataNascita"]);
            $('<p id="dataNascita">').html(date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear()).appendTo(_desc);
            $('<p id="indirizzo">').html(item["indirizzo"]).appendTo(_desc);
            $('<p id="telefono">').html(item["telefono"]).appendTo(_desc);
        }
    })

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