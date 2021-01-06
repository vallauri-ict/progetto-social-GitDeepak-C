$(document).ready(function() {
	
	setTimeout(function(){
		$('body').addClass('loaded');
	}, 1700);
	
});

$(document).ready(function(){   
    
    $(".btn-responsive-menu").click(function() {
        $("#mainmenu").toggleClass("show");}); 
});