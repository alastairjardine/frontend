define([], function() {

    var oldContainers = [
           'uk/culture/regular-stories',
           'uk/business/regular-stories',
           'uk/lifeandstyle/regular-stories',
           'uk/technology/regular-stories',
           'uk/money/regular-stories',
           'uk/travel/regular-stories'
        ],

        newContainers = [
            'uk-alpha/contributors/feature-stories',
            'uk-alpha/people-in-the-news/feature-stories'
        ];

    function cssDisplayNone(dataIds) {
        return [].concat(dataIds).map(function(id) {return '.container[data-id="' + id + '"]';}).join(',') + '{display: none}';
    }
    
    function hide(ids) {
        var el = document.createElement('style');

        el.type = 'text/css';
        if (el.styleSheet) { // IE
            el.styleSheet.cssText = cssDisplayNone(ids);
        } else { // Other browsers
            el.innerHTML = cssDisplayNone(ids);
        }
        document.body.appendChild(el);
    }
    
    var hideOld = hide.bind(null, oldContainers);
    var hideNew = hide.bind(null, newContainers);
    
    return function() {
        this.id = 'BlendedContainers';
        this.expiry = '2014-04-08';
        this.audience = 1;
        this.audienceOffset = 0.0;
        this.description = 'Testing new blended containers on the UK network front';
        this.canRun = function() {
            return ['/uk'].indexOf(window.location.pathname) > -1;
        };
        this.variants = [
            {
                id: 'control',
                test: hideNew
            },
            {
                id: 'blended-containers',
                test: hideOld
            }
        ];
        this.notInTest = hideNew;
    };
});