var AUDIO = (function() {
    var ambientURL = null;

    var checkForAudio = function(slideIndex) {
        for (var i = 0; i < COPY.content.length; i++) {
            var rowAnchor = COPY.content[i]['id'];
            var ambientFilename = COPY.content[i]['ambient_audio']

            var $currentSlide = $slides.eq(slideIndex);
            var loopId = 'slide-' + rowAnchor;

            if (loopId === $currentSlide.attr('id') && ambientFilename !== null && !NO_AUDIO) {

                ambientURL = ASSETS_PATH + ambientFilename;

                if (ambientFilename === 'STOP') {
                    $ambientPlayer.jPlayer('pause');
                    return;
                }
                setAmbientMedia(ambientURL);
            }
        }
    }

    var setupAmbientPlayer = function() {
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
            mp3: ASSETS_PATH + 'prototype/school-ambi.mp3'
        }).jPlayer('pause');
    }

    var toggleAllAudio = function() {
        if (isHidden()) {
            $ambientPlayer.jPlayer('pause');
        } else {
            $ambientPlayer.jPlayer('play');
        }
    }

    return {
        'checkForAudio': checkForAudio,
        'toggleAllAudio': toggleAllAudio,
        'setupAmbientPlayer': setupAmbientPlayer,
        'setAmbientMedia': setAmbientMedia,
        'fakeAmbientPlayer': fakeAmbientPlayer,
    }
}());