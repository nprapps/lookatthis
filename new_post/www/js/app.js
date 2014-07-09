// Global state
var pymChild = null;
var $reblog = null;
var $like = null;
var $share = null;
var $notes = null;
var $nextPostTitle = null;
var $nextPostImage = null;
var $nextPostURL = null;

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {

    $reblog = $('.reblog');
    $like = $('.like');
    $share = $('.share');
    $notes = $('.notes');
    $nextPostTitle = $('.next-post-title');
    $nextPostImage = $('.next-post-image');
    $nextPostURL = $('.next-post-url');

    pymChild = new pym.Child();

    pymChild.on('post', onParentPost);
    pymChild.sendMessageToParent('handshake', 'b');
};

var onParentPost = function(data) {
    data = JSON.parse(data);

    var nextPost = data.next_post;

    console.log(data);

    $nextPostTitle.text(nextPost.title);
    $nextPostImage.attr('src', nextPost.image);
    $nextPostURL.attr('href', nextPost.url);

}

$(onDocumentLoad);
