
(function ($) {
    "use strict";


    /*==================================================================
    [ Focus input ]*/
    $('.input100').each(function(){
        $(this).on('blur', function(){
            if($(this).val().trim() != "") {
                $(this).addClass('has-val');
            }
            else {
                $(this).removeClass('has-val');
            }
        })    
    })
  
  
    /*==================================================================
    [ Validate ]*/
    var input = $('.validate-input .input100');

    $('.validate-form').on('submit',function(e){
        e.preventDefault(); //stop reload page on form sumbit

        var check = true;

        for(var i=0; i<input.length; i++) {
            if(validate(input[i]) == false){
                showValidate(input[i]);
                check=false;
            }
        }
        if(check){
            inviaRq(input);
        }
        return check;       
    });


    $('.validate-form .input100').each(function(){
        $(this).focus(function(){
           hideValidate(this);
        });
    });

    function validate (input) {
        if($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        }
        else {
            if($(input).val().trim() == ''){
                return false;
            }
        }
    }

    function inviaRq(){
        let file = $('#txtFile').prop('files')[0];		
		if (!file)
			alert("Selezionare un immagine!!")		
		else {
			let request = resize(file)
            request.catch(function (err) { console.log(err.message)})		
			request.then(function(base64data){     
				//console.log(base64data);
				let req = inviaRichiesta("POST", "/api/signUp", 
                                        {   
                                            "email":$('[name="email"]').val(), 
                                            "name": $('[name="nome"]').val(), 
                                            "surname": $('[name="surname"]').val(), 
                                            "address": $('[name="address"]').val(),
                                            "imgProfile": base64data
                                        });
                req.fail(errore);
                req.done(function(data) {
                    console.log(data);
                    window.location.href = "../index.html";
                });
            })
        }				        
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }
    
    /*==================================================================
    [ Show pass ]*/
    var showPass = 0;
    $('.btn-show-pass').on('click', function(){
        if(showPass == 0) {
            $(this).next('input').attr('type','text');
            $(this).addClass('active');
            showPass = 1;
        }
        else {
            $(this).next('input').attr('type','password');
            $(this).removeClass('active');
            showPass = 0;
        }
        
    });

    function resize(file){
        return new Promise(function(resolve, reject) {
            const WIDTH = 640;
            const HEIGHT = 480;
            let reader = new FileReader();   
            // legge e restituisce il file in formato base 64
            reader.readAsDataURL(file)
            //reader.addEventListener("load", function () {
            reader.onload = function(){	
                // $('#imgPreview').prop('src', reader.result); 			 
                let img = new Image()
                img.src = reader.result	  						
                img.onload = function(){
                    if(img.width<WIDTH && img.height<HEIGHT)
                        resolve(reader.result);
                    else{
                        let canvas = document.createElement("canvas");
                        if(img.width>img.height){
                            canvas.width=WIDTH;
                            canvas.height=img.height*(WIDTH/img.width)
                        }
                        else{	
                            canvas.height=HEIGHT
                            canvas.width=img.width*(HEIGHT/img.height);
                        }
                        let _pica = new pica()						
                        _pica.resize(img, canvas, {
                              unsharpAmount: 80,
                              unsharpRadius: 0.6,
                              unsharpThreshold: 2
                        })
                        .then(function (resizedImage){
                            _pica.toBlob(resizedImage, 'image/jpeg', 0.90)
                            .then(function (blob){
                                var reader = new FileReader();
                                reader.readAsDataURL(blob); 
                                reader.onload = function() {
                                    resolve(reader.result);
                                }
                            })
                            .catch(err => reject(err.message))							
                        })	
                        .catch(err => reject(err.message))			
                    }
                }		
            }	
        })	
    }


})(jQuery);