var AUDIO = (function() {
    var audioURL = null;

    var checkForAudio = function(slideIndex) {
        for (var i = 0; i < COPY.content.length; i++) {
            var rowAnchor = COPY.content[i]['id'];
            var filename = COPY.content[i]['audio'];

            var $currentSlide = $slides.eq(slideIndex);
            var loopId = 'slide-' + rowAnchor;

            if (loopId === $currentSlide.attr('id') && filename !== null) {
                audioURL = ASSETS_PATH + 'audio/' + filename;
                $thisPlayerProgress = $currentSlide.find('.player-progress');
                $playedBar = $currentSlide.find('.player-progress .played');
                $controlBtn = $currentSlide.find('.control-btn');

                _playAudio();
            } else {
                _pauseAudio();
            }
        }
    }

    var setupAudio = function() {
        $audioPlayer.jPlayer({
            swfPath: 'js/lib',
            loop: false,
            supplied: 'mp3',
            timeupdate: onTimeupdate,
            volume: NO_AUDIO ? 0 : 1
        });
    }

    var _playAudio = function() {
        $audioPlayer.jPlayer('setMedia', {
            mp3: audioURL
        }).jPlayer('play');
        $controlBtn.removeClass('play').addClass('pause');
    }

    var _pauseAudio = function() {
        $audioPlayer.jPlayer('pause');
        $controlBtn.removeClass('pause').addClass('play');
    }

    var _resumeAudio = function() {
        $audioPlayer.jPlayer('play');
        $controlBtn.removeClass('play').addClass('pause');
    }


    var onTimeupdate = function(e) {
        var totalTime = e.jPlayer.status.duration;
        var position = e.jPlayer.status.currentTime;

        // animate progress bar
        var percentage = position / totalTime;

        if (position > 0) {
            // if we're resetting the bar. ugh.
            if ($playedBar.width() == $thisPlayerProgress.width()) {
                $playedBar.addClass('no-transition');
                $playedBar.css('width', 0);
            } else {
                $playedBar.removeClass('no-transition');
                $playedBar.css('width', $thisPlayerProgress.width() * percentage + 'px');

                if (percentage === 1) {
                    $controlBtn.removeClass('pause').addClass('play');
                }
            }
        }
    }

    var toggleAudio = function() {
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