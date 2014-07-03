var $window = null;
var $document = null;

if (!window.slug) {
    var slug = document.location.href.split('/')[5];
}
var pymParent = null;

/*
 * Run on page load.
 */
var onDocumentLoad = function(e) {
    // Cache jQuery references
    $window = $(window);
    $document = $(document);

    // pymParent = new pym.Parent('post', 'http://localhost:8000/posts/test/', {});
    pymParent = new pym.Parent('post', 'http://localhost:8000/posts/' + slug + '/', {});
}

$(onDocumentLoad);