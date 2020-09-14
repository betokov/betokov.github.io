$(document).ready(function(){
    $('.sertificat').selectric();
    $('.station').selectric();

    $('.choice-btn').on('click', function(e) {
        e.preventDefault();

        $('html, body').animate({
           scrollTop: $('.get-help').offset().top
        }, 1000);
    });

    $('.choice-link').on('click', function(e) {
        if($(this).find('.choice-checkbox').prop('checked')) {
            $(this).find('.choice-checkbox').prop('checked', false);
            e.preventDefault();
        } else {
            $(this).find('.choice-checkbox').prop('checked', true);
        }
    });


    $('.burger').on('click', function() {
        $('.sub-menu-inner').slideToggle();
        if($(this).attr('style')) {
            $(this).removeAttr('style');
        } else {
            $(this).css('background-image', 'url(img/close.png)');
        }
    });

    function tabBlock() {
        $('.tab a').click(function (e) {
            e.preventDefault();
            $('a').removeClass('active');
            $(this).addClass('active');
            var tab = $(this).attr('href');
            $('.tab__box').not(tab).css({'display': 'none'});
            $(tab).fadeIn(400);
        });
        $('.tab a:first').click();
    }

    if(window.innerWidth >= 1100) {
        tabBlock();
    }

    $( window ).resize(function() {
        if(window.innerWidth >= 1100) {
            tabBlock();
        } else {
            $('#tab1').removeAttr('style');
            $('#tab2').removeAttr('style');
        }
    });

    var swiper = new Swiper('.documents__slider', {
        loop: true,
        spaceBetween: 60,
        slidesPerView: 5,
        navigation: {
            nextEl: '.documents-block .swiper-button-next',
            prevEl: '.documents-block .swiper-button-prev',
        },
        pagination: {
            el: '.documents-block .swiper-pagination',
            // dynamicBullets: true,
            dynamicMainBullets: 4,
            clickable: true,
        },
        breakpoints: {
            599: {
                slidesPerView: 1.3,
                spaceBetween: 42,
            },
            767: {
                slidesPerView: 2.3,
                spaceBetween: 42,
            },
            991: {
                slidesPerView: 2.3,
                spaceBetween: 42,
            },
            1100: {
                slidesPerView: 3.3,
                spaceBetween: 42,
            },
            1599: {
                slidesPerView: 4.3,
                spaceBetween: 42,
            }
        }
    });

    var swiper2 = new Swiper('.certificates__slider', {
        loop: true,
        spaceBetween: 80,
        slidesPerView: 4,
        navigation: {
            nextEl: '.certificates-block .swiper-button-next',
            prevEl: '.certificates-block .swiper-button-prev',
        },
        pagination: {
            el: '.certificates-block .swiper-pagination',
            // dynamicBullets: true,
            dynamicMainBullets: 4,
            clickable: true,
        },
        breakpoints: {
            499: {
                slidesPerView: 1.1,
                spaceBetween: 16,
            },
            767: {
                slidesPerView: 1.5,
                spaceBetween: 16,
            },
            1099: {
                slidesPerView: 2.5,
                spaceBetween: 16,
            },
            1599: {
                slidesPerView: 3.5,
                spaceBetween: 16,
            }
        }
    });

    var swiper3 = new Swiper('.advantages__slider', {
        loop: true,
        spaceBetween: 80,
        slidesPerView: 4,
        navigation: {
            nextEl: '.advantages-block .swiper-button-next',
            prevEl: '.advantages-block .swiper-button-prev',
        },
        pagination: {
            el: '.advantages-block .swiper-pagination',
            // dynamicBullets: true,
            dynamicMainBullets: 4,
            clickable: true,
        },
        breakpoints: {
            499: {
                slidesPerView: 1.1,
                spaceBetween: 16,
            },
            767: {
                slidesPerView: 1.5,
                spaceBetween: 16,
            },
            1099: {
                slidesPerView: 2.5,
                spaceBetween: 16,
            },
            1599: {
                slidesPerView: 3.5,
                spaceBetween: 16,
            }
        }
    });

    var swiper4 = null;

    function swiperSLider() {
        swiper4 = new Swiper('.info__slider', {
            loop: true,
            spaceBetween: 10,
            slidesPerView: 1,
            navigation: {
                nextEl: '.info-block .swiper-button-next',
                prevEl: '.info-block .swiper-button-prev',
            },
            pagination: {
                el: '.info-block .swiper-pagination',
                // dynamicBullets: true,
                dynamicMainBullets: 4,
                clickable: true,
                loop: true,
            }
        });
    }

    if(window.innerWidth >= 1100) {
        swiperSLider();
    }

    $( window ).resize(function() {
        if(window.innerWidth >= 1100) {
            swiperSLider();
        } else {
            if(swiper4) {
                swiper4.destroy(false, false);
                swiper4 = null;
            }
        }
    });

    var checkDiv = document.querySelector('#map');
    var YaMapsShown = false;
    if (checkDiv != null) {

        $(window).scroll(function() {
            if (!YaMapsShown) {
                if ($(window).scrollTop() >= 2000) {
                    var elem = document.createElement('script');
                    elem.type = 'text/javascript';
                    elem.src = 'https://api-maps.yandex.ru/2.1/?apikey=7293582a-d52e-4d29-9127-18e638c44040&lang=ru_RU';

                    $('body').append(elem);
                    YaMapsShown = true;
                    setTimeout(function() {
                        ymaps.ready(init);

                        function init() {

                            var myMap = new ymaps.Map("map", {
                                center: [55.76, 37.64],
                                controls: ['zoomControl', 'geolocationControl'],
                                zoom: 11
                            });

                            myMap.behaviors.disable('scrollZoom');
                        }
                    }, 500);
                }
            }
        });
    }

});

