var AUDIO = (function() {
    var narrativePlayer = null;
    var ambientPlayer = null;
    var ambientId = null;
    var progressInterval = null;
    var narrativeURL = null;
    var ambientURL = null;
    var narrativeVisible = false;
    var currentIndex = null;

    var checkForAudio = function(slideIndex) {
        currentIndex = slideIndex;

        var slideId = $slides.eq(slideIndex).attr('id');
        slideId = slideId.split("slide-");
        slideId = slideId[1];

        for (var i = 0; i < copy.content.length; i++) {
            var rowAnchor = copy.content[i]['id'];
            var narrativeFilename = copy.content[i]['narrative_audio'];
            var ambientFilename = copy.content[i]['ambient_audio'];

            if (rowAnchor === slideId && narrativeFilename !== null && !NO_AUDIO) {
                $thisPlayerProgress = $('#slide-' + rowAnchor).find('.player-progress');
                $playedBar = $('#slide-' + rowAnchor).find('.player-progress .played');
                $controlBtn = $('#slide-' + rowAnchor).find('.control-btn');
                $subtitleWrapper = $('#slide-' + rowAnchor).find('.subtitle-wrapper');
                $subtitles = $('#slide-' + rowAnchor).find('.subtitles');

                narrativeURL = APP_CONFIG.S3_BASE_URL + '/posts/bus-station/assets/' + narrativeFilename;
                setNarrativeMedia();
            } else {
                _pauseNarrativePlayer();
                narrativeVisible = false;
            }

            if (rowAnchor === slideId && ambientFilename !== null && !NO_AUDIO) {

                ambientURL = APP_CONFIG.S3_BASE_URL + '/posts/bus-station/assets/' + ambientFilename;

                if (ambientFilename === 'STOP') {
                    $ambientPlayer.jPlayer('pause');
                    return;
                }

                if (ambientURL !== $ambientPlayer.data().jPlayer.status.src) {
                    setAmbientMedia(ambientURL);
                }
            }
        }
    }

    var setUpNarrativePlayer = function() {
        $narrativePlayer.jPlayer({
            swfPath: 'js/lib',
            loop: false,
            supplied: 'mp3',
            timeupdate: onNarrativeTimeupdate,
        });
    }

    var setNarrativeMedia = function() {
        console.log(narrativeURL);
        $narrativePlayer.jPlayer('setMedia', {
            mp3: narrativeURL
        });

        narrativeVisible = true;
        setTimeout(function() {
            $narrativePlayer.jPlayer('play');
            $controlBtn.removeClass('play').addClass('pause');
        }, 1000)
    }

    var _resumeNarrativePlayer = function() {
        $narrativePlayer.jPlayer('play');
        $controlBtn.removeClass('play').addClass('pause');
    }

    var _pauseNarrativePlayer = function(end) {
        $narrativePlayer.jPlayer('pause');
        if (end) {
            $playedBar.css('width', $thisPlayerProgress.width() + 'px');
        }
        $controlBtn.removeClass('pause').addClass('play');
    }

    var toggleNarrativeAudio = function() {
        if ($narrativePlayer.data('jPlayer').status.paused) {
            _resumeNarrativePlayer();
        } else {
            _pauseNarrativePlayer(false);
        }
    }

    var fakeNarrativePlayer = function() {
        $narrativePlayer.jPlayer('setMedia', {
            mp3: APP_CONFIG.S3_BASE_URL + '/posts/bus-station/assets/prototype/' + 'ambi-bed.mp3'
        }).jPlayer('pause');
    }

    var onNarrativeTimeupdate = function(e) {
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

        // trigger the animation

        if (totalTime > 0) {
            var animationTrigger = 3;
            console.log(position, animationTrigger);
            if (position > animationTrigger &&!($slides.eq(currentIndex).hasClass('audio-quote-fade'))) {
                $slides.eq(currentIndex).addClass('audio-quote-fade');
            }
        }
    }

    var setUpAmbientPlayer = function() {
        $ambientPlayer.jPlayer({
            swfPath: 'js/lib',
            supplied: 'mp3',
        });
    }

    var setAmbientMedia = function(url) {
        $ambientPlayer.jPlayer('setMedia', {
            mp3: url
        }).jPlayer('play');
    }

    var fakeAmbientPlayer = function() {
        $ambientPlayer.jPlayer('setMedia', {
            mp3: APP_CONFIG.S3_BASE_URL + '/posts/bus-station/assets/prototype/' + 'ambi-bed.mp3'
        }).jPlayer('pause');
    }

    var toggleAllAudio = function() {
        if (isHidden()) {
            if (narrativeVisible) {
                _pauseNarrativePlayer(false);
            }
            $ambientPlayer.jPlayer('pause');

        } else {
            if (narrativeVisible) {
                _resumeNarrativePlayer();
            }
            $ambientPlayer.jPlayer('play');
        }
    }

    return {
        'checkForAudio': checkForAudio,
        'toggleNarrativeAudio': toggleNarrativeAudio,
        'toggleAllAudio': toggleAllAudio,
        'setUpAmbientPlayer': setUpAmbientPlayer,
        'setUpNarrativePlayer': setUpNarrativePlayer,
        'setAmbientMedia': setAmbientMedia,
        'fakeAmbientPlayer': fakeAmbientPlayer,
        'fakeNarrativePlayer': fakeNarrativePlayer,
    }
}());