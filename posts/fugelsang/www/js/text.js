document.addEventListener('DOMContentLoaded',function(e){
var pop = Popcorn( '#moodmusic');

/////////////// !CHAPTER 1
//start
pop.code({
	start: 32,
	end: 33,
	onStart: function( options ) {
    	$.fn.fullpage.moveSlideRight();
	}
});

//conclusion
// pop.code({
// 	start: 2,
// 	end: 10,
// 	onStart: function( options ) {
//     	$('.story-conclusion').addClass('thats-all-folks');
//     	$('.full-block-cell').addClass('light-mask');
//     	$('.photo-modal-trigger').addClass('fade-out');
// 	}
// });

//up-next
// pop.code({
// 	start: 153,
// 	end: 154,
// 	onStart: function( options ) {
//     	$('.next').addClass('please-proceed');
// 	}
// });

/////////////// end
},false);

