var AUDIO = (function() {
    var setUpPlayer = function() {
        $player.jPlayer('play');

        $play.hide();
        $pause.show();
    }

    var onTimeupdate = function(e) {
        var timeText = $.jPlayer.convertTime(e.jPlayer.status.currentTime);
        $('.current-time').text(timeText);

        var duration = e.jPlayer.status.duration;
        var position = e.jPlayer.status.currentTime;

        // implementing my own ended event everything is terrible
        if (position >= duration - 0.5) {
            onEnded();
        }

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
                    $.fn.fullpage.moveTo(0, i);
                    break;
                }
            }
        }

        if ($animatedElements) {
            for (var i = 0; i < $animatedElements.length; i++) {
                var entranceTime = $animatedElements.eq(i).data('entrance') || null;
                var exitTime = $animatedElements.eq(i).data('exit') || slideEndTime - 1;

                if (position > entranceTime) {
                    $animatedElements.eq(i).css('opacity', 1);
                }
                if (position > exitTime) {
                    $animatedElements.eq(i).css('opacity', 0);
                }
            }
        }

    }

    var onEnded = function() {
        $play.hide();
        $pause.hide();
        $replay.show();

        $player.jPlayer('pause');
    }

    var _resumePlayer = function() {
        $player.jPlayer('play');
    }

    var _pausePlayer = function(end) {
        $player.jPlayer('pause');
        if (end) {
            $playedBar.css('width', $thisPlayerProgress.width() + 'px');
        }
    }

    var toggleAudio = function(e) {
        e.preventDefault();
        if ($player.data().jPlayer.status.paused) {
            _resumePlayer();
            $play.hide();
            $pause.show();
        } else {
            _pausePlayer(false);
            $play.show();
            $pause.hide();
        }
    }

    var reset = function(e) {
        e.preventDefault();
        $.fn.fullpage.moveTo(0, 1);
        $player.jPlayer('playHead', 0);
        $player.jPlayer('play');

        $play.hide();
        $replay.hide();
        $pause.show();
    }

    return {
        'toggleAudio': toggleAudio,
        'setUpPlayer': setUpPlayer,
        'onTimeupdate': onTimeupdate,
        'reset': reset,
        'onEnded': onEnded
    }
}());