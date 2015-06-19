var FILMSTRIP = (function() {
    var $currentSlide = null;
    var $filmstripContainer = null;
    var animating = false;

    var initFilmstrip = function(slideIndex) {
        $currentSlide = $slides.eq(slideIndex);
        $filmstripContainer = $currentSlide.find('.imgLiquid');

        for (var i = 0; i < COPY.content.length; i++) {
            var rowAnchor = COPY.content[i]['id'];
            var loopId = 'slide-' + rowAnchor;

            var filmstripFolder = COPY.content[i]['filmstrip_folder']
            var filmstripLength = parseInt(COPY.content[i]['filmstrip_length']);

            if (loopId === $currentSlide.attr('id') && filmstripFolder && filmstripLength) {
                _loadImages(filmstripFolder, filmstripLength);
            }
        }
    }

    var _loadImages = function(folder, length) {
        var imageSlug = 'assets/sequences/' + folder + '/' + folder;
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

        _animateFilmstrip();
    }

    var _animateFilmstrip = function() {
        if (!animating) {
            var imageCounter = 0;
            var $frames = $filmstripContainer.find('.frame');
            animating = true;
            var animation = setInterval(function() {
                $frames.eq(imageCounter).css('opacity', 1);
                imageCounter = imageCounter + 1;
                if (imageCounter === $frames.length) {
                    clearInterval(animation);
                    animating = false;
                }
            }, 200);
        }
    }

    var clearFilmstrip = function(index) {
        $slides.eq(index).find('.imgLiquid .frame').css('opacity', 0);
    }

    return {
        'initFilmstrip': initFilmstrip,
        'clearFilmstrip': clearFilmstrip
    }
}());