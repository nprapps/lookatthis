document.addEventListener('DOMContentLoaded',function(e){
var pop = Popcorn( '#moodmusic');

/////////////// !CHAPTER 1
//start
pop.code({
	start: .5,
	end: 1.5,
	onStart: function( options ) {
    	$('.full-block-cell').removeClass('light-mask');
    	$('.story-conclusion').removeClass('thats-all-folks');
    	$('.photo-modal-trigger').removeClass('fade-out');
	}
});

//conclusion
pop.code({
	start: 100,
	end: 101,
	onStart: function( options ) {  
    	$('.story-conclusion').addClass('thats-all-folks');
    	$('.full-block-cell').addClass('light-mask');
    	$('.photo-modal-trigger').addClass('fade-out');
	}
});

/////////////// end     
},false);

