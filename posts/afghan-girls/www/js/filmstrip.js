var FILMSTRIP = (function() {
    var animating = false;
    var animation = null;

    var initFilmstrip = function($slide) {
        for (var i = 0; i < COPY.content.length; i++) {
            var rowAnchor = COPY.content[i]['id'];
            var loopId = 'slide-' + rowAnchor;

            var filmstripFolder = COPY.content[i]['filmstrip_folder']
            var filmstripLength = parseInt(COPY.content[i]['filmstrip_length']);

            if (loopId === $slide.attr('id') && filmstripFolder && filmstripLength) {
                _loadImages(filmstripFolder, filmstripLength, $slide);
            }
        }
    }

    var _loadImages = function(folder, length, $slide) {
        var imageSlug = 'assets/sequences/' + folder + '/' + folder;
        var $filmstripContainer = $slide.find('.imgLiquid');
        var $frames = $filmstripContainer.find('.frame');

        if ($frames.length !== length) {
            var remainingFrames = $frames.length + 1;
            for (var i = remainingFrames; i <= length; i++) {
                if (i < 10) {
                    var numPrefix = '00';
                } else {
                    var numPrefix = '0';
                }

                var fullImagePath = imageSlug + numPrefix + i.toString() + '.jpg';
                $filmstripContainer.append('<img class="frame" src="' + fullImagePath + '">');
            }
        }
    }

    var animateFilmstrip = function(index) {
        $filmstripContainer = $slides.eq(index).find('.imgLiquid');
        $filmstripContainer.imagesLoaded(function() {
            if (!animating) {
                var imageCounter = 0;
                var $frames = $filmstripContainer.find('.frame');
                animating = true;
                animation = setInterval(function() {
                    console.log($slides.eq(index).css('opacity'));
                    if ($slides.eq(index).css('opacity') === '1') {
                        $frames.eq(imageCounter).css('opacity', 1);
                        imageCounter = imageCounter + 1;
                        if (imageCounter === $frames.length) {
                            clearInterval(animation);
                            animating = false;
                        }
                    }
                }, 200);
            }
        });
    }

    var clearFilmstrip = function(index) {
        clearInterval(animation);
        animating = false;
        $slides.eq(index).find('.imgLiquid .frame').css('opacity', 0);
    }

    return {
        'initFilmstrip': initFilmstrip,
        'animateFilmstrip': animateFilmstrip,
        'clearFilmstrip': clearFilmstrip
    }
}());