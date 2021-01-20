"use strict";

$(document).ready(function (){
    let loggedUser,
        valPrima;

    let req = inviaRichiesta("GET", "/api/getUsername");
    req.fail(errore);
    req.done(function(data){
        loggedUser = data["username"];
        console.log(loggedUser);
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
            $("#email").html(data["email"]);
            $("#dataNascita").html(date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear());
            $("#indirizzo").html(data["indirizzo"]);
            let req = inviaRichiesta("POST", "/api/getUserPost", {"username": loggedUser});
            req.fail(errore);
            req.done(function(data){
                console.log(data);
                for(let item of data){
                    $("<div>").addClass("post").css({"background": "url(" + item["imgPost"] + ") no-repeat", "background-size": "cover"}).appendTo($("#userPost"));
                }
            })
        })
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

    $("#btnModifica").on("click", function(e){
        $("#desc p").attr("contenteditable", true).on("click", function(){
            valPrima = $(this).html();
        }).bind("blur", chechNewval);
        $(this).focus();
        setEndOfContenteditable(e.target);
    })

    function chechNewval(){        
        $(this).html(function (i, html) {
            return html.replace(/&nbsp;/g, '');
        });
        let newVal = $(this).html();
        if(valPrima != newVal){
            let id = $(this).attr("id");
            if(controllaInserimento(id, newVal)){
                let req = inviaRichiesta("POST", "/api/modifyUserData", {"username": loggedUser, "id": id, "nuovoValore": newVal});
                req.fail(errore);
                req.done(function(data){
                    alert("Dati modificati correttamente!!");
                })
            }
            else
                alert("Inserire un valore corretto!!");
        }
    }

    function controllaInserimento(type, newVal){
        let ok = false;
        switch(type){
            case "email":
                    let reg = /^\b[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b$/i;
                    if(reg.test(newVal)){
                        ok = true;
                    }
                break;
            case "dataNascita":
                    reg = /([0-9][1-2])\/([0-2][0-9]|[3][0-1])\/((19|20)[0-9]{2})/;
                    if(reg.test(newVal)){
                        ok = true;
                    }
                break;
                case "indirizzo":
                    ok = true;
                    break;
        }
        return ok;
    }

    function setEndOfContenteditable(contentEditableElement) {
        var range, selection;
        if (document.createRange) //Firefox, Chrome, Opera, Safari, IE 9+
        {
          range = document.createRange(); //Create a range (a range is a like the selection but invisible)
          range.selectNodeContents(contentEditableElement); //Select the entire contents of the element with the range
          range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
          selection = window.getSelection(); //get the selection object (allows you to change selection)
          selection.removeAllRanges(); //remove any selections already made
          selection.addRange(range); //make the range you have just created the visible selection
        } else if (document.selection) //IE 8 and lower
        {
          range = document.body.createTextRange(); //Create a range (a range is a like the selection but invisible)
          range.moveToElementText(contentEditableElement); //Select the entire contents of the element with the range
          range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
          range.select(); //Select the range (make it the visible selection
        }
      }
});