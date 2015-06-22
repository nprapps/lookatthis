var AUDIO = (function() {
    var audioURL = null;

    var checkForAudio = function(slideIndex) {
        for (var i = 0; i < COPY.content.length; i++) {
            var rowAnchor = COPY.content[i]['id'];
            var filename = COPY.content[i]['audio'];

            var $currentSlide = $slides.eq(slideIndex);
            var loopId = 'slide-' + rowAnchor;

            if (loopId === $currentSlide.attr('id') && filename !== null) {

                audioURL = ASSETS_PATH + filename;
                if ($audioPlayer.data().jPlayer.status.src !== audioURL) {
                    _playAudio();
                }
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
            cssSelectorAncestor: "#jp_container_1",
            smoothPlayBar: true,
            volume: NO_AUDIO ? 0 : 1
        });
    }

    var _playAudio = function() {
        $audioPlayer.jPlayer('setMedia', {
            mp3: audioURL
        }).jPlayer('play');

        $play.hide();
        $pause.show();
    }

    var _pauseAudio = function() {
        $audioPlayer.jPlayer('pause');
        $play.show();
        $pause.hide();
    }

    var _resumeAudio = function() {
        $audioPlayer.jPlayer('play');
        $play.hide();
        $pause.show();
    }


    var onTimeupdate = function() {

    }

    var toggleAudio = function(e) {
        e.preventDefault();
        if ($audioPlayer.data().jPlayer.status.paused) {
            _resumeAudio();
        } else {
            _pauseAudio();
        }
    }

    return {
        'checkForAudio': checkForAudio,
        'setupAudio': setupAudio,
        'toggleAudio': toggleAudio
    }
}());