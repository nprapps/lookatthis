var AUDIO = (function() {
    var audioURL = null;
    var slug = null;
    var fourFiveSeconds = false;
    var twentyFiveComplete = false;
    var fiftyComplete = false;
    var seventyFiveComplete = false;

    var checkForAudio = function(slideIndex) {
        for (var i = 0; i < COPY.content.length; i++) {
            var rowAnchor = COPY.content[i]['id'];
            var filename = COPY.content[i]['audio'];

            var $currentSlide = $slides.eq(slideIndex);
            var loopId = 'slide-' + rowAnchor;

            if (loopId === $currentSlide.attr('id') && filename !== null) {
                audioURL = ASSETS_PATH + 'audio/' + filename;
                slug = filename;
                $thisPlayerProgress = $currentSlide.find('.player-progress');
                $playedBar = $currentSlide.find('.player-progress .played');
                $controlBtn = $currentSlide.find('.control-btn');

                $thisPlayerProgress.on('click', onSeekBarClick);

                _playAudio();
                break;
            } else {
                _pauseAudio();
            }
        }
    }

    var setupAudio = function() {
        $audioPlayer.jPlayer({
            swfPath: 'js/lib',
            ended: onEnded,
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
        ANALYTICS.trackEvent('audio-started', slug);
        // reset global vars
        fourFiveSeconds = false;
        twentyFiveComplete = false;
        fiftyComplete = false;
        seventyFiveComplete = false;
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
        var duration = e.jPlayer.status.duration;
        var position = e.jPlayer.status.currentTime;

        // animate progress bar
        var percentage = position / duration;

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
        _trackCompletion(position, duration);
    }

    var _trackCompletion = function(position, duration) {
        var completion = position / duration;

        if (position > 5 && !fourFiveSeconds) {
            ANALYTICS.trackEvent('audio-five-seconds', slug);
            fourFiveSeconds = true;
        }
        if (completion >= 0.25 && !twentyFiveComplete) {
            ANALYTICS.trackEvent('audio-completion-0.25', slug);
            twentyFiveComplete = true;
        } else if (completion >= 0.5 && !fiftyComplete) {
            ANALYTICS.trackEvent('audio-completion-0.50', slug);
            fiftyComplete = true;
        } else if (completion >= 0.75 && !seventyFiveComplete) {
            ANALYTICS.trackEvent('audio-completion-0.75', slug);
            seventyFiveComplete = true;
        }
    }

    var onEnded = function() {
        ANALYTICS.trackEvent('audio-completion-1', slug);

        fourFiveSeconds = false;
        twentyFiveComplete = false;
        fiftyComplete = false;
        seventyFiveComplete = false;
    }

    var toggleAudio = function() {
        if ($audioPlayer.data().jPlayer.status.paused) {
            _resumeAudio();
            ANALYTICS.trackEvent('resume-audio');
        } else {
            _pauseAudio();
            ANALYTICS.trackEvent('pause-audio');
        }
    }

    var onSeekBarClick = function(e) {
        e.preventDefault();
        var totalTime = $audioPlayer.data().jPlayer.status.duration;
        var percentage = e.offsetX / $(this).width();
        var clickedPosition = totalTime * percentage;
        $audioPlayer.jPlayer('play', clickedPosition);
        $controlBtn.removeClass('play').addClass('pause');
        ANALYTICS.trackEvent('seek', slug);
        e.stopPropagation();
    }

    return {
        'checkForAudio': checkForAudio,
        'setupAudio': setupAudio,
        'toggleAudio': toggleAudio
    }
}());