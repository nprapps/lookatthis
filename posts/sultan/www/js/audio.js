var $audioPlayer = null;

var AUDIO = (function() {
    var isAnimating = false;
    var fourFiveSeconds = false;
    var twentyFiveComplete = false;
    var fiftyComplete = false;
    var seventyFiveComplete = false;
    var completed = false;

    var setupAudio = function() {
        $audioPlayer.jPlayer({
            swfPath: 'js/lib',
            loop: false,
            supplied: 'mp3',
            timeupdate: onTimeupdate,
            ended: onEnded,
            volume: NO_AUDIO ? 0 : 1
        });
    }

    var onEnded = function() {
        $play.hide();
        $pause.hide();
        $replay.show();
        var lastSlide = $slides.length - 1;
        $.deck('go', lastSlide);
        if (!completed) {
            ANALYTICS.completeOneHundredPercent();
            completed = true;
        }
    }

    var playAudio = function() {
        var audioURL = ASSETS_PATH + 'audio.mp3';

        $audioPlayer.jPlayer('setMedia', {
            mp3: audioURL
        });
        $audioPlayer.jPlayer('playHead', 0);
        $audioPlayer.jPlayer('play');
        $play.hide();
        $pause.show();
        $replay.hide();
    }

    var _pauseAudio = function() {
        $audioPlayer.jPlayer('pause');
        $play.show();
        $pause.hide();
        $replay.hide();
        ANALYTICS.trackEvent('pause-audio');
    }

    var _resumeAudio = function() {
        $audioPlayer.jPlayer('play');
        $play.hide();
        $pause.show();
        $replay.hide();
        ANALYTICS.trackEvent('resume-audio')
    }

    var toggleAudio = function(e) {
        if (!$(this).hasClass('replay')) {
            e.preventDefault();
            if ($audioPlayer.data().jPlayer.status.paused) {
                _resumeAudio();
            } else {
                _pauseAudio();
            }
        }
    }

    var reset = function(e) {
        e.preventDefault();
        lastSlideExitEvent = 'reset-button-click';
        ANALYTICS.trackEvent('reset');
        $.deck('go', 1);
        $playerWrapper.css({
            'visibility': 'hidden',
            'opacity': '0'
        });

        fourFiveSeconds = false;
        twentyFiveComplete = false;
        fiftyComplete = false;
        seventyFiveComplete = false;
        completed = false;
    }

    var onTimeupdate = function(e) {
        var timeText = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
        $('.current-time').text(timeText);

        var duration = e.jPlayer.status.duration;
        var position = e.jPlayer.status.currentTime;

        if (position > 0) {
            for (var i = 0; i < $slides.length; i++) {
                var endTime = $slides.eq(i).data('slide-end-time');

                // if the position is less than the end time of the slide of this loop
                if (position < endTime && currentIndex > 0) {
                    // if we're reached this slide, don't do anything
                    if (i === currentIndex) {
                        break;
                    }
                    // once we've managed to loop past the current slide, move to that slide
                    else {
                        lastSlideExitEvent = 'audio-timeupdate';
                        $.deck('go', i);
                        break;
                    }
                }
            }
            if ($animatedElements) {
                for (var i = 0; i < $animatedElements.length; i++) {
                    var $el = $animatedElements.eq(i);

                    var entranceTime = $el.data('entrance') || null;
                    var exitTime = $el.data('exit') || slideEndTime - 2;
                    if (
                        (position > entranceTime) &&
                        (position < exitTime) &&
                        ($el.css('opacity') < 1) &&
                        (!isAnimating)
                    ) {
                        $el.velocity({
                            opacity: 1
                        }, {
                            duration: 1000,
                            easing: "ease-in",
                            begin: function() {
                                isAnimating = true;
                            },
                            complete: function() {
                                isAnimating = false;
                            }
                        });
                    }
                    if (position > exitTime && $el.css('opacity') !== 0 && !isAnimating) {
                        $el.velocity({
                            opacity: 0
                        }, {
                            duration: 1000,
                            easing: "ease-in",
                            begin: function() {
                                isAnimating = true;
                            },
                            complete: function(){
                                isAnimating = false;
                            }
                        });
                    }
                }
            }

            if (position > endTime - 1 && $slides.eq(currentIndex).hasClass('fade-out-bg') && !$audioPlayer.data().jPlayer.status.paused) {
                $slides.eq(currentIndex).velocity({
                    'opacity': 0
                },
                {
                    duration: 1000,
                    easing: "ease-in"
                });
            }
        }
        _trackCompletion(position, duration);
    }

    var _trackCompletion = function(position, duration) {
        var completion = position / duration;

        if (position > 5 && !fourFiveSeconds) {
            ANALYTICS.fiveSecondsComplete();
            fourFiveSeconds = true;
        }

        if (completion >= 0.25 && !twentyFiveComplete) {
            ANALYTICS.completeTwentyFivePercent();
            twentyFiveComplete = true;
        } else if (completion >= 0.5 && !fiftyComplete) {
            ANALYTICS.completeFiftyPercent();
            fiftyComplete = true;
        } else if (completion >= 0.75 && !seventyFiveComplete) {
            ANALYTICS.completeSeventyFivePercent();
            seventyFiveComplete = true;
        }
    }

    var onSeekBarClick = function(e) {
        ANALYTICS.trackEvent('seek-audio');
    }

    return {
        'setupAudio': setupAudio,
        'playAudio': playAudio,
        'toggleAudio': toggleAudio,
        'reset': reset,
        'onSeekBarClick': onSeekBarClick
    }
}());

$(document).ready(function() {
    $audioPlayer = $('#player');
    AUDIO.setupAudio();
});
