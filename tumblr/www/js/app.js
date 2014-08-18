var $window;
var $document;
var $videoContainers;

var sizeVideoContainers = function(element){
	var scope = element||document;
	var $videoIframe = $(scope).find('.tumblr_video_iframe, .video-container img');

	$videoIframe.each(function(){
		var $this = $(this);

		// Don't recalculate if we've already assigned an aspect ratio
		if ($this.parents('.video-container').hasClass('nine-by-sixteen vertical square sixteen-by-nine')){
			return;
		}

		var height = parseInt($this.attr('height'));
		var width = parseInt($this.attr('width'));

		if (height == 780 && width == 700) {
			$this.attr('height', '100%');
			$this.attr('width', '100%');
			$this.parents('.video-container').addClass('spotify');
		}

		if (height > width){
			$this.parents('.video-container').addClass('nine-by-sixteen');
			$this.parents('.video-wrapper').addClass('vertical');
		} else if (height == width) {
			$this.parents('.video-container').addClass('square');
		} else {
			$this.parents('.video-container').addClass('sixteen-by-nine');
		}

		$this.parent().attr('style', '');
	});
}

$(function() {
	$window = $(window);
	$document = $(document);
	$videoContainers = $('.video-container');



	$videoContainers.fitVids({ customSelector: "video"});

	$window.on('resize', function(){
		$vineEmbeds = $document.find('iframe.vine-embed');
		$vineEmbeds.each(function(){
			var vidSrc = $(this).attr('src');
			$(this).attr('src', vidSrc);
		});
	});

	sizeVideoContainers();

});