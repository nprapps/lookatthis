/*
 * Google Analytics
 */
var _gaq = _gaq || [];
_gaq.push(['_setAccount', APP_CONFIG.GOOGLE_ANALYTICS.ACCOUNT_ID]);
_gaq.push(['_setDomainName', APP_CONFIG.GOOGLE_ANALYTICS.DOMAIN]);

_gaq.push(['_trackPageview']);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

/*
 * Comscore
 */
var _comscore = _comscore || [];
_comscore.push({ c1: "2", c2: "17691522" });
(function() {
    var s = document.createElement("script"), el = document.getElementsByTagName("script")[0]; s.async = true;
    s.src = (document.location.protocol == "https:" ? "https://sb" : "http://b") + ".scorecardresearch.com/beacon.js";
    el.parentNode.insertBefore(s, el);
})();

/*
 * Nielson
 */
(function () {
    var d = new Image(1, 1);
    d.onerror = d.onload = function () { d.onerror = d.onload = null; };
    d.src = ["//secure-us.imrworldwide.com/cgi-bin/m?ci=us-803244h&cg=0&cc=1&si=", escape(window.location.href), "&rp=", escape(document.referrer), "&ts=compact&rnd=", (new Date()).getTime()].join('');
})();   

/*
 * Chartbeat
 */
var _sf_async_config={};
/** CONFIGURATION START **/
_sf_async_config.uid = 18888;
_sf_async_config.domain = "npr.org";
/** CONFIGURATION END **/
(function(){
    function loadChartbeat() {
        window._sf_endpt=(new Date()).getTime();
        var e = document.createElement("script");
        e.setAttribute("language", "javascript");
        e.setAttribute("type", "text/javascript");
        e.setAttribute("src",
            (("https:" == document.location.protocol) ?
             "https://a248.e.akamai.net/chartbeat.download.akamai.com/102508/" :
             "http://static.chartbeat.com/") +
            "js/chartbeat.js");
        document.body.appendChild(e);
    }
    var oldonload = window.onload;
    window.onload = (typeof window.onload != "function") ?
        loadChartbeat : function() { oldonload(); loadChartbeat(); };
})();

