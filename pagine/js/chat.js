"use strict";

$(document).ready(function () {
	let username;

	let req = inviaRichiesta("GET", "/api/getUsername");
	req.fail(errore);
	req.done(function(data){
		username = data["username"];
	});
	
	let socket = io.connect();
	console.log("socket: " + socket);
	
	socket.on('connect', function(){				
		// 1) invio username
		socket.emit("username", username);
			
		// 2) invio mesaggio
		$("#btnInvia").click(function () {
			let msg = $("#txtMessage").val();
			socket.emit("message", msg);
		});
		
		// 3) disconnessione
		$("#btnDisconnetti").click(function () {
			socket.disconnect();
		});
	});

	
	socket.on('notify_message', function(data){
		// ricezione di un messaggio dal server			
		data = JSON.parse(data); 
		visualizza(data.from, data.message, data.date);	
	});

	
	socket.on('disconnect', function(){
		//alert("Sei stato disconnesso!");
		let d = new Date();
		//visualizza(username, JSON.stringify("Sei stato disconnesso!", d));	
		$("#btnInvia").attr("enabled", false);
		$("#btnDisconnetti").attr("enabled", false);
		window.location = "../index.html";
	});
	

	
	function visualizza (username, message, date) {
		let wrapper = $("#wrapper")
		let container = $("<div class='message-container'></div>");
		container.appendTo(wrapper);
		
		// username e date
		date = new Date(date); 				
		let mittente = $("<small class='message-from'>" + username + " @" + date.toLocaleTimeString() + "</small>");
		mittente.appendTo(container);
	
		// messaggio
		message = $("<p class='message-data'>" + message + "</p>");
		message.appendTo(container);
		
		
		// auto-scroll dei messaggi
		/* la proprietà html scrollHeight rappresenta l'altezza di wrapper oppure
		   l'altezza del testo interno qualora questo ecceda l'altezza di wrapper */ 
		let h = wrapper.get(0).scrollHeight; 
		// fa scorrere il teso verso l'alto
		wrapper.animate({scrollTop: h}, 500);
	}
});
