var AUDIO = (function() {
    var audioURL = null;

    var checkForAudio = function(slideIndex) {
        for (var i = 0; i < COPY.content.length; i++) {
            var rowAnchor = COPY.content[i]['id'];
            var filename = COPY.content[i]['audio'];

            var $currentSlide = $slides.eq(slideIndex);
            var loopId = 'slide-' + rowAnchor;

            if (loopId === $currentSlide.attr('id') && filename !== null && !NO_AUDIO) {

                audioURL = ASSETS_PATH + filename;
                _playAudio();
            } else {
                // if (!$audioPlayer.data().jPlayer.status.paused) {
                //     _pauseAudio();
                // }
            }
        }
    }

    var setupAudio = function() {
        $audioPlayer.jPlayer({
            swfPath: 'js/lib',
            loop: false,
            supplied: 'mp3',
            timeupdate: onTimeupdate,
        });
    }

    var _playAudio = function() {
        $audioPlayer.jPlayer('setMedia', {
            mp3: audioURL
        }).jPlayer('play');
    }

    var _pauseAudio = function() {
        $audioPlayer.jPlayer('pause');
    }

    var onTimeupdate = function() {

    }
    return {
        'checkForAudio': checkForAudio,
        'setupAudio': setupAudio,
    }
}());