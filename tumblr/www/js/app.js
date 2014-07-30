// Global jQuery references
var $firstPost = null;

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    $firstPost = $('#posts').find('.post').first();

    var $firstPostImage = $firstPost.find('img');

    $firstPostImage.attr('src', $firstPostImage.data('highres-image'));
}

$(onDocumentLoad);
