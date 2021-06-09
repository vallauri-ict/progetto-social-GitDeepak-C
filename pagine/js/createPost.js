"use strict";

var reader;

$(document).ready(function (){   
    $("#btnAddPost").on("click", function(){
        let desc = document.getElementById("txtDesc").value,
            file = reader.result;
        if(file && desc){
            let request = inviaRichiesta("POST", "/api/addPost", {
                "photo": file,
                "description": desc
            })
            request.done(function(data){
                console.log(data);
                if(data.ris == "OK"){
                    window.location = '../index.html';
                }
            });
            request.fail(function(err){
                console.log(err.message);
            })
        }
    });

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

function previewFile() {
    var preview = document.querySelector('img');
    var file = document.querySelector('input[type=file]').files[0];
    reader = new FileReader();

    reader.onloadend = function () {
        preview.src = reader.result;
    }

    if (file) {
        reader.readAsDataURL(file);
    } else {
        preview.src = "";
    }
}