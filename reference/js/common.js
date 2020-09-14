$(document).ready(function(){

    let spans = document.querySelectorAll('.centers-middle-inner span');

    spans.forEach(function(i) {
        i.addEventListener('click', function() {
            spans.forEach(function(i) { i.classList.remove('active')});

            i.classList.add('active');
        }) ;
    });

    $('.centers-middle select').selectric();

    $('.burger').on('click', function() {
        $('.header-bottom__inner').slideToggle();

        if($(this).attr('style')) {
            $(this).removeAttr('style');
        } else {
            $(this).css('background-image', 'url(img/close.png)');
        }
    });

    $('.form select').selectric();

    $(window).resize(function() {
        if($(window).innerWidth() >= 1100) {
            if($('.header-bottom__inner').attr('style')) {
                $('.header-bottom__inner').removeAttr('style');
            }

            if($('.burger').attr('style')) {
                $('.burger').removeAttr('style');
            }
            // $('.burger').css('background-image', 'url(img/burger.png)');
        }
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
                slidesPerView: 1.3,
                spaceBetween: 0
            },
            767: {
                slidesPerView: 2.2,
                spaceBetween: 20
            },
            1099: {
                slidesPerView: 3.5,
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

    if($(window).innerWidth() >= 1100) {
        var swiper2 = new Swiper('.new-form-slider', {
            loop: true,
            spaceBetween: 10,
            slidesPerView: 5,
            navigation: {
                nextEl: '.new-form-block .swiper-button-next',
                prevEl: '.new-form-block .swiper-button-prev',
            },
            breakpoints: {
                1279: {
                    slidesPerView: 3,
                    spaceBetween: 10
                },
                1599: {
                    slidesPerView: 4,
                    spaceBetween: 5
                },
                1919: {
                    slidesPerView: 4,
                    spaceBetween: 10
                }
            }
        });
    }

    var swiper3 = new Swiper('.select-center-slider', {
        loop: true,
        spaceBetween: 10,
        slidesPerView: 5,
        navigation: {
            nextEl: '.select-center-block .swiper-button-next',
            prevEl: '.select-center-block .swiper-button-prev',
        },
        breakpoints: {
            499: {
                slidesPerView: 1.3,
                spaceBetween: 15
            },
            767: {
                slidesPerView: 2.2,
                spaceBetween: 20
            },
            991: {
                slidesPerView: 3,
                spaceBetween: 20
            },
            1099: {
                slidesPerView: 3.5,
                spaceBetween: 20
            },
            1399: {
                spaceBetween: 20,
                slidesPerView: 3
            },

            1599: {
                spaceBetween: 0,
                slidesPerView: 4
            },

        }
    });

    $('.my-description button').on('click', function () {
        if(this.innerHTML == 'далее') {
            $('.my-description span').css('display', 'inline');
            this.innerHTML = 'закрыть';
            $(this).addClass('close');
        } else {
            $('.my-description span').removeAttr('style');
            this.innerHTML = 'далее';
            $(this).removeClass('close');
        }

    });

    let header = $('.header').innerHeight();
    $(window).scroll(function () {
            if($(this).scrollTop() >= header){
                $('.header').addClass('fix-menu');
            } else {
                $('.header').removeClass('fix-menu');
            }
    });



});
