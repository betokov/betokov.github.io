/*! npm.im/object-fit-images 3.2.4 */
var objectFitImages=function(){"use strict";function t(t,e){return"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='"+t+"' height='"+e+"'%3E%3C/svg%3E"}function e(t){if(t.srcset&&!p&&window.picturefill){var e=window.picturefill._;t[e.ns]&&t[e.ns].evaled||e.fillImg(t,{reselect:!0}),t[e.ns].curSrc||(t[e.ns].supported=!1,e.fillImg(t,{reselect:!0})),t.currentSrc=t[e.ns].curSrc||t.src}}function i(t){for(var e,i=getComputedStyle(t).fontFamily,r={};null!==(e=u.exec(i));)r[e[1]]=e[2];return r}function r(e,i,r){var n=t(i||1,r||0);b.call(e,"src")!==n&&h.call(e,"src",n)}function n(t,e){t.naturalWidth?e(t):setTimeout(n,100,t,e)}function c(t){var c=i(t),o=t[l];if(c["object-fit"]=c["object-fit"]||"fill",!o.img){if("fill"===c["object-fit"])return;if(!o.skipTest&&f&&!c["object-position"])return}if(!o.img){o.img=new Image(t.width,t.height),o.img.srcset=b.call(t,"data-ofi-srcset")||t.srcset,o.img.src=b.call(t,"data-ofi-src")||t.src,h.call(t,"data-ofi-src",t.src),t.srcset&&h.call(t,"data-ofi-srcset",t.srcset),r(t,t.naturalWidth||t.width,t.naturalHeight||t.height),t.srcset&&(t.srcset="");try{s(t)}catch(t){window.console&&console.warn("https://bit.ly/ofi-old-browser")}}e(o.img),t.style.backgroundImage='url("'+(o.img.currentSrc||o.img.src).replace(/"/g,'\\"')+'")',t.style.backgroundPosition=c["object-position"]||"center",t.style.backgroundRepeat="no-repeat",t.style.backgroundOrigin="content-box",/scale-down/.test(c["object-fit"])?n(o.img,function(){o.img.naturalWidth>t.width||o.img.naturalHeight>t.height?t.style.backgroundSize="contain":t.style.backgroundSize="auto"}):t.style.backgroundSize=c["object-fit"].replace("none","auto").replace("fill","100% 100%"),n(o.img,function(e){r(t,e.naturalWidth,e.naturalHeight)})}function s(t){var e={get:function(e){return t[l].img[e?e:"src"]},set:function(e,i){return t[l].img[i?i:"src"]=e,h.call(t,"data-ofi-"+i,e),c(t),e}};Object.defineProperty(t,"src",e),Object.defineProperty(t,"currentSrc",{get:function(){return e.get("currentSrc")}}),Object.defineProperty(t,"srcset",{get:function(){return e.get("srcset")},set:function(t){return e.set(t,"srcset")}})}function o(){function t(t,e){return t[l]&&t[l].img&&("src"===e||"srcset"===e)?t[l].img:t}d||(HTMLImageElement.prototype.getAttribute=function(e){return b.call(t(this,e),e)},HTMLImageElement.prototype.setAttribute=function(e,i){return h.call(t(this,e),e,String(i))})}function a(t,e){var i=!y&&!t;if(e=e||{},t=t||"img",d&&!e.skipTest||!m)return!1;"img"===t?t=document.getElementsByTagName("img"):"string"==typeof t?t=document.querySelectorAll(t):"length"in t||(t=[t]);for(var r=0;r<t.length;r++)t[r][l]=t[r][l]||{skipTest:e.skipTest},c(t[r]);i&&(document.body.addEventListener("load",function(t){"IMG"===t.target.tagName&&a(t.target,{skipTest:e.skipTest})},!0),y=!0,t="img"),e.watchMQ&&window.addEventListener("resize",a.bind(null,t,{skipTest:e.skipTest}))}var l="bfred-it:object-fit-images",u=/(object-fit|object-position)\s*:\s*([-.\w\s%]+)/g,g="undefined"==typeof Image?{style:{"object-position":1}}:new Image,f="object-fit"in g.style,d="object-position"in g.style,m="background-size"in g.style,p="string"==typeof g.currentSrc,b=g.getAttribute,h=g.setAttribute,y=!1;return a.supportsObjectFit=f,a.supportsObjectPosition=d,o(),a}();


$(document).ready(function(){

    $('.metro').selectric();
    $('.form select').selectric();

    $('.header-left button').click(function(e){
        e.preventDefault();

        $('.header-down').slideToggle();

        $(this).toggleClass('burger_active');
    });

    var swiper = new Swiper('.license-slider', {
        loop: true,
        spaceBetween: 120,
        slidesPerView: 5,
        navigation: {
            nextEl: '.license-block .swiper-button-next',
            prevEl: '.license-block .swiper-button-prev',
        },
        breakpoints: {
            499: {
                slidesPerView: 1,
                spaceBetween: 0
            },
            767: {
                slidesPerView: 2,
                spaceBetween: 20
            },
            1099: {
                slidesPerView: 3,
                spaceBetween: 20
            },
            1599: {
                slidesPerView: 4,
                spaceBetween: 20
            },
            1919: {
                spaceBetween: 10,
                slidesPerView: 5
            }
        }
    });

    var swiper2 = new Swiper('.reference-slider', {
        loop: true,
        spaceBetween: 16,
        slidesPerView: 4,
        navigation: {
            nextEl: '.reference-block .swiper-button-next',
            prevEl: '.reference-block .swiper-button-prev',
        },
        breakpoints: {
            600: {
                slidesPerView: 1,
                spaceBetween: 20
            },
            767: {
                slidesPerView: 2,
                spaceBetween: 20
            },
            1199: {
                slidesPerView: 3,
                spaceBetween: 20
            },
            1919: {
                spaceBetween: 10,
                slidesPerView: 4
            }
        }
    });

}); //ready

window.onload = function() {

    document.querySelector('.next').onclick = function(e) {
        e.preventDefault();

        let points = document.querySelector('.points');
        let text = document.querySelectorAll('.med-description__hide');

        text.forEach((item) => {
            if(!item.getAttribute('style')) {
                item.style.display = "block";
            }
        });

        points.style.display = "none";
        this.style.display = "none";
    }

    let tabLinks = document.querySelectorAll('.tab-list a'),
        tabItems = document.querySelectorAll('.tab-bottom__item');

    tabItems[0].classList.add('tab-bottom__item_block', 'tab-bottom__item_opacity');
    tabLinks[0].classList.add('tab-active');

    tabLinks.forEach((item, index) => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            changeTab.call(item);
        });
    });

    function changeTab() {
        let linkHref = this.getAttribute('href');

        tabLinks.forEach((item, index) => {
            item.classList.remove('tab-active');
        });

        this.classList.add('tab-active');

        tabItems.forEach((item) => {
            item.classList.remove('tab-bottom__item_block', 'tab-bottom__item_opacity');
        });

        document.querySelector(linkHref).classList.add('tab-bottom__item_block');

        setTimeout(function() {
            document.querySelector(linkHref).classList.add('tab-bottom__item_opacity');
        }, 100)
    }

    let countForMap = 0,
        offsetTopMap = document.querySelector('.my-map').offsetTop,
        clientHeightMap = document.querySelector('.my-map').clientHeight;

//Загружать карту при загрузе html если (высота до карты - высота карты - место скрола <= высоты экрана)
    window.onload = function() {
        if(offsetTopMap - clientHeightMap - this.pageYOffset <= this.innerHeight) {
            createScriptTag();
            unicMap();
        }
    }

//Загружать карту при скроле страницы (скролл >= высоты до карты - высота экрана)
    window.onscroll = function() {
        if((this.pageYOffset >= (document.querySelector('.my-map').offsetTop) - this.innerHeight) && countForMap == 0) {
            createScriptTag();
            unicMap();
            countForMap++;
        }

        //Для >=IE11 картинок с object-fit: cover
        objectFitImages();
    }

//Создание тега скрипта
    function createScriptTag() {
        let tagScript = document.createElement('script'),
            apiKey = '7293582a-d52e-4d29-9127-18e638c44040';

        tagScript.setAttribute('src', 'https://api-maps.yandex.ru/2.1/?apikey='+apiKey+'&lang=ru_RU');
        tagScript.setAttribute('async', 'async');
        document.querySelector('body').appendChild(tagScript);
    }

//Создание Карты
    function unicMap() {
        setTimeout(function() {
            ymaps.ready(init);

            function init() {
                var myMap = new ymaps.Map("map", {
                        center: [55.76, 37.64],
                        controls: ['zoomControl', 'geolocationControl'],
                        zoom: 11
                    }),
                    MyIconContentLayout = ymaps.templateLayoutFactory.createClass(
                        '<div class="map-img">$[properties.iconContent]</div>'
                    ),
                    myPlacemark = new ymaps.Placemark([55.77799500291261,37.609733380859375], {
                        // Чтобы балун и хинт открывались на метке, необходимо задать ей определенные свойства.
                        balloonContentHeader: "<p class='map-header'><a href='#'>Медицинский центр <br> (метро Марьино)</a></p>",
                        balloonContentBody: "<div class='map-middle'><span>4,8</span> <ul><li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li></ul></div>",
                        balloonContentFooter: "<span class='map-footer'><a href='#'>Марьино</a></span>",
                        hintContent: "Марьино"
                    }, {
                        iconLayout: 'default#imageWithContent',
                        iconImageHref: 'img/cross.png',
                        iconImageSize: [20, 20],
                        iconImageOffset: [-24, -24],
                        // Смещение слоя с содержимым относительно слоя с картинкой.
                        iconContentOffset: [15, 15],
                        // Макет содержимого.
                        iconContentLayout: MyIconContentLayout
                    }),

                    myPlacemark2 = new ymaps.Placemark([55.74668327879408,37.53842078828892], {
                        // Чтобы балун и хинт открывались на метке, необходимо задать ей определенные свойства.
                        balloonContentHeader: "<p class='map-header'><a href='#'>Медицинский центр <br> (метро Марьино)</a></p>",
                        balloonContentBody: "<div class='map-middle'><span>4,8</span> <ul><li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li></ul></div>",
                        balloonContentFooter: "<span class='map-footer'><a href='#'>Марьино2</a></span>",
                        hintContent: "Марьино2"
                    }, {
                        iconLayout: 'default#imageWithContent',
                        iconImageHref: 'img/cross.png',
                        iconImageSize: [20, 20],
                        iconImageOffset: [-24, -24],
                        // Смещение слоя с содержимым относительно слоя с картинкой.
                        iconContentOffset: [15, 15],
                        // Макет содержимого.
                        iconContentLayout: MyIconContentLayout
                    }),

                myPlacemark3 = new ymaps.Placemark([55.72610324328652,37.62277964550782], {
                    balloonContentHeader: "<p class='map-header'><a href='#'>Медицинский центр <br> (метро Марьино)</a></p>",
                    balloonContentBody: "<div class='map-middle'><span>4,8</span> <ul><li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li></ul></div>",
                    balloonContentFooter: "<span class='map-footer'><a href='#'>Марьино3</a></span>",
                    hintContent: "Марьино3"
                }, {
                    iconLayout: 'default#imageWithContent',
                    iconImageHref: 'img/cross.png',
                    iconImageSize: [20, 20],
                    iconImageOffset: [-24, -24],
                    // Смещение слоя с содержимым относительно слоя с картинкой.
                    iconContentOffset: [15, 15],
                    // Макет содержимого.
                    iconContentLayout: MyIconContentLayout
                }),

                myPlacemark4 = new ymaps.Placemark([55.748959649724775,37.7044904609375], {
                    balloonContentHeader: "<p class='map-header'><a href='#'>Медицинский центр <br> (метро Марьино)</a></p>",
                    balloonContentBody: "<div class='map-middle'><span>4,8</span> <ul><li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li></ul></div>",
                    balloonContentFooter: "<span class='map-footer'><a href='#'>Марьино4</a></span>",
                    hintContent: "Марьино4"
                }, {
                    iconLayout: 'default#imageWithContent',
                    iconImageHref: 'img/cross.png',
                    iconImageSize: [20, 20],
                    iconImageOffset: [-24, -24],
                    // Смещение слоя с содержимым относительно слоя с картинкой.
                    iconContentOffset: [15, 15],
                    // Макет содержимого.
                    iconContentLayout: MyIconContentLayout
                }),

                myPlacemark5 = new ymaps.Placemark([55.81849766940336,37.54325983737467], {
                    balloonContentHeader: "<p class='map-header'><a href='#'>Медицинский центр <br> (метро Марьино)</a></p>",
                    balloonContentBody: "<div class='map-middle'><span>4,8</span> <ul><li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li></ul></div>",
                    balloonContentFooter: "<span class='map-footer'><a href='#'>Марьино5</a></span>",
                    hintContent: "Марьино5"
                }, {
                    iconLayout: 'default#imageWithContent',
                    iconImageHref: 'img/cross.png',
                    iconImageSize: [20, 20],
                    iconImageOffset: [-24, -24],
                    // Смещение слоя с содержимым относительно слоя с картинкой.
                    iconContentOffset: [15, 15],
                    // Макет содержимого.
                    iconContentLayout: MyIconContentLayout
                }),

                myPlacemark6 = new ymaps.Placemark([55.81551519948306,37.63994578320313], {
                    balloonContentHeader: "<p class='map-header'><a href='#'>Медицинский центр <br> (метро Марьино)</a></p>",
                    balloonContentBody: "<div class='map-middle'><span>4,8</span> <ul><li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li></ul></div>",
                    balloonContentFooter: "<span class='map-footer'><a href='#'>Марьино6</a></span>",
                    hintContent: "Марьино6"
                }, {
                    iconLayout: 'default#imageWithContent',
                    iconImageHref: 'img/cross.png',
                    iconImageSize: [20, 20],
                    iconImageOffset: [-24, -24],
                    // Смещение слоя с содержимым относительно слоя с картинкой.
                    iconContentOffset: [15, 15],
                    // Макет содержимого.
                    iconContentLayout: MyIconContentLayout
                }),

                    myPlacemark7 = new ymaps.Placemark([55.80071048128378,37.724534251437184], {
                        balloonContentHeader: "<p class='map-header'><a href='#'>Медицинский центр <br> (метро Марьино)</a></p>",
                        balloonContentBody: "<div class='map-middle'><span>4,8</span> <ul><li><img src='img/star.png' alt='star'></li><li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li> <li><img src='img/star.png' alt='star'></li></ul></div>",
                        balloonContentFooter: "<span class='map-footer'><a href='#'>Марьино7</a></span>",
                        hintContent: "Марьино7"
                    }, {
                        iconLayout: 'default#imageWithContent',
                        iconImageHref: 'img/cross.png',
                        iconImageSize: [20, 20],
                        iconImageOffset: [-24, -24],
                        // Смещение слоя с содержимым относительно слоя с картинкой.
                        iconContentOffset: [15, 15],
                        // Макет содержимого.
                        iconContentLayout: MyIconContentLayout
                    });



                myMap.geoObjects.add(myPlacemark);
                myMap.geoObjects.add(myPlacemark2);
                myMap.geoObjects.add(myPlacemark3);
                myMap.geoObjects.add(myPlacemark4);
                myMap.geoObjects.add(myPlacemark5);
                myMap.geoObjects.add(myPlacemark6);
                myMap.geoObjects.add(myPlacemark7);
                myMap.behaviors.disable('scrollZoom');

            }

        }, 500);
    }

} //END Window


