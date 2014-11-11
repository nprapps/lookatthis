document.addEventListener('DOMContentLoaded',function(e){
var pop = Popcorn( '#moodmusic');

/////////////// !CHAPTER 1

//intro
pop.code({
	start: 5,
	onStart: function( options ) {  
		$('#pic-conclusion').addClass('show-me');
		$('.feature-pic').addClass('fade-me');
		//$('#s1b').css('background-image', 'url(' + 'img/antique-car.jpg' + ')');
		//$("p").addClass("myClass yourClass");
	}
});

/////////////// end     
},false);

