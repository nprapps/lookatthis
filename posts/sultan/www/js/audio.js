var $audioPlayer = null;

var AUDIO = (function() {
    var audioURL = 'http://assets.apps.npr.org/lookatthis/astroreid-loves/wiseman2.mp3';
    var isAnimating = false;

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
        console.log('ended');
    }

    var playAudio = function() {
        $audioPlayer.jPlayer('setMedia', {
            mp3: audioURL
        }).jPlayer('play');
        $play.hide();
        $pause.show();
        $replay.hide();
    }

    var _pauseAudio = function() {
        $audioPlayer.jPlayer('pause');
        $play.show();
        $pause.hide();
        $replay.hide();
    }

    var _resumeAudio = function() {
        $audioPlayer.jPlayer('play');
        $play.hide();
        $pause.show();
        $replay.hide();
    }

    var toggleAudio = function(e) {
        e.preventDefault();
        if ($audioPlayer.data().jPlayer.status.paused) {
            _resumeAudio();
        } else {
            _pauseAudio();
        }
    }

    var reset = function(e) {
        e.preventDefault();
        $.deck('go', 0);
        $audioPlayer.jPlayer('playHead', 0);
        $audioPlayer.jPlayer('play');
    }


    var onTimeupdate = function(e) {
        var timeText = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
        $('.current-time').text(timeText);

        var duration = e.jPlayer.status.duration;
        var position = e.jPlayer.status.currentTime;

        // implementing my own ended event everything is terrible
        // if (position >= duration - 0.5) {
        //     onEnded();
        // }

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
                    $.deck('next');
                    break;
                }
            }
        }

        if ($animatedElements) {
            for (var i = 0; i < $animatedElements.length; i++) {
                var $el = $animatedElements.eq(i);

                var entranceTime = $el.data('entrance') || null;
                var exitTime = $el.data('exit') || slideEndTime - 2;
                if ($el.hasClass('fast')) {
                    var speed = 1000;
                } else {
                    var speed = 2000;
                }
                if (
                    (position > entranceTime) &&
                    (position < exitTime) &&
                    ($el.css('opacity') < 1) &&
                    (!isAnimating)
                ) {
                    $el.velocity({
                        opacity: 1
                    }, {
                        duration: speed,
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
                        duration: speed,
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

        if (position > endTime - 2 && $slides.eq(currentIndex).hasClass('fade-out-bg')) {
            $slides.eq(currentIndex).velocity({
                'opacity': 0
            },
            {
                duration: 2000,
                easing: "ease-in"
            });
        }
    }

    var onSeekBarClick = function(e) {
        var totalTime = $audioPlayer.data().jPlayer.status.duration;
        var percentage = e.offsetX / $(this).width();
        var clickedPosition = totalTime * percentage;
        $audioPlayer.jPlayer('play', clickedPosition);
        $controlBtn.removeClass('play').addClass('pause');
        ANALYTICS.trackEvent('seek', $audioPlayer.data().jPlayer.status.src);
    }

    return {
        'setupAudio': setupAudio,
        'playAudio': playAudio,
        'toggleAudio': toggleAudio
    }
}());

$(document).ready(function() {
    $audioPlayer = $('#player');
    AUDIO.setupAudio();
});
