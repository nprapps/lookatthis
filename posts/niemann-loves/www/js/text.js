document.addEventListener('DOMContentLoaded',function(e){
var pop = Popcorn( '#moodmusic');

/////////////// !CHAPTER 1
//start
pop.code({
	start: .5,
	onStart: function( options ) {
    	$('.full-block-cell').removeClass('light-mask');
    	$('.story-conclusion').removeClass('thats-all-folks');
		//$('#pic-conclusion').removeClass('show-me');
		//$('.feature-pic').removeClass('fade-me');
		//$('.pic-wrap').addClass('fade-wrap');
		//$('#s1b').css('background-image', 'url(' + 'img/antique-car.jpg' + ')');
		//$("p").addClass("myClass yourClass");
	}
});

//conclusion
pop.code({
	start: 3,
	onStart: function( options ) {  
    	$('.story-conclusion').addClass('thats-all-folks');
    	$('.full-block-cell').addClass('light-mask');
    	
		//$('#pic-conclusion').addClass('show-me');
		//$('.feature-pic').addClass('fade-me');
		//$('#s1b').css('background-image', 'url(' + 'img/antique-car.jpg' + ')');
		//$("p").addClass("myClass yourClass");
	}
});

/////////////// end     
},false);

