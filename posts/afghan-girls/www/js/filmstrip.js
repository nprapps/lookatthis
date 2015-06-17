var FILMSTRIP = (function() {
    var $currentSlide = null;

    var initFilmstrip = function(slideIndex) {
        $currentSlide = $slides.eq(slideIndex);
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
        var loadedImages = [];
        var imageSlug = 'assets/sequences/' + folder + '/' + folder;
        for (var i = 1; i <= length; i++) {
            if (i < 10) {
                var numPrefix = '00';
            } else {
                var numPrefix = '0';
            }

            var fullImagePath = imageSlug + numPrefix + i.toString() + '.JPG';
            var img = new Image();
            img.onload = function() {
                loadedImages.push(this);

                // when all the images have loaded, start the animation
                if (loadedImages.length === length) {
                    setTimeout(function() {
                        _animateFilmstrip(loadedImages);
                    }, 1000);
                }
            }
            img.src = fullImagePath;
        }
    }

    var _animateFilmstrip = function(loadedImages) {
        var $filmstripContainer = $currentSlide.find('.imgLiquid');
        var imageCounter = 0;

        setInterval(function() {
            $filmstripContainer.css('background-image', 'url(' + loadedImages[imageCounter].src + ')');
            imageCounter = imageCounter + 1;

            if (imageCounter > loadedImages.length) {
                clearInterval();
            }
        }, 200);
    }

    return {
        'initFilmstrip': initFilmstrip
    }
}());