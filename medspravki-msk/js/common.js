$(document).ready(function () {

	$(".burger").click(function () {
		$(this).toggleClass('is-active');
		$('.hidden-menu-dsc').slideToggle();
	});

	$(".burger-mob").click(function () {
		$(this).toggleClass('is-active');
		$('.mob-dropdown').toggleClass('is-active');
	});

	$(".link-mob").click(function (e) {
		e.preventDefault();
		var $this = $(this);
		var elem = $(this).next();

		if (!$this.hasClass("is-active")) {
			$(".inner-menu").slideUp();
			$(".link-mob").removeClass("is-active");
		}

		$this.toggleClass("is-active");
		elem.slideToggle();

	});

	$('.form-select select').selectric();

	var myAdvSlider = undefined;

	function initSwiper() {
		var screenWidth = $(window).width();
		if (screenWidth > 767 && myAdvSlider == undefined) {
			var advSlider = new Swiper('.advantage-slider', {
				slidesPerView: 5,
				spaceBetween: 38,
				loop: true,
				navigation: {
					nextEl: '.swiper-button-next-adv',
					prevEl: '.swiper-button-prev-adv',
				},

				breakpoints: {

					992: {
						slidesPerView: 2,
						spaceBetween: 20,
					},
					1279: {
						slidesPerView: 3,
						spaceBetween: 20,
					},
					1840: {
						slidesPerView: 4,
						spaceBetween: 20,
					},
				}
			});
		} else if (screenWidth < 768 && myAdvSlider != undefined) {
			myAdvSlider.destroy();
			myAdvSlider = undefined;
		}
	}

	//Swiper plugin initialization
	initSwiper();

	//Swiper plugin initialization on window resize
	$(window).on('resize', function () {
		initSwiper();
	});

	var docSlider = new Swiper('.specialist-slider', {
		slidesPerView: 5,
		spaceBetween: 90,
		loop: true,
		navigation: {
			nextEl: '.swiper-button-next-sp',
			prevEl: '.swiper-button-prev-sp',
		},
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
		},

		breakpoints: {
			499: {
				slidesPerView: 1,
				spaceBetween: 20,
			},
			767: {
				slidesPerView: 2,
				spaceBetween: 20,
			},
			991: {
				slidesPerView: 3,
				spaceBetween: 20,

			},
			1599: {
				slidesPerView: 4,
				spaceBetween: 20,
			}
		}
	});


	new Swiper('.license-slider', {
		loop: true,
		spaceBetween: 120,
		slidesPerView: 5,
		navigation: {
			nextEl: '.license-block .swiper-button-next',
			prevEl: '.license-block .swiper-button-prev',
		},
		pagination: {
			el: '.swiper-pagination',
			type: 'bullets',
			clickable: true
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

	var advantages = new Swiper('.advantages-slider', {
		loop: true,
		spaceBetween: 60,
		slidesPerView: 6,
		init: false,
		navigation: {
			nextEl: '.advantages-block .swiper-button-next',
			prevEl: '.advantages-block .swiper-button-prev',
		},
		pagination: {
			el: '.swiper-pagination',
			type: 'bullets',
			clickable: true
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

	window.addEventListener('resize', function () {
		let width = this.innerWidth;

		if (width < 1100 && advantages) {
			anythingSwiper.destroy();
			advantages.destroy();
		} else {
			anythingSwiper.init();
		}
	});


	new Swiper('.anything-up-slider', {
		loop: true,
		spaceBetween: 10,
		slidesPerView: 7,
		navigation: {
			nextEl: '.anything-up-block .swiper-button-next',
			prevEl: '.anything-up-block .swiper-button-prev',
		},
		breakpoints: {
			499: {
				slidesPerView: 1.3,
				spaceBetween: 0
			},
			767: {
				slidesPerView: 2.5,
				spaceBetween: 20
			},
			1099: {
				slidesPerView: 3.5,
				spaceBetween: 20
			},
			1279: {
				slidesPerView: 3,
				spaceBetween: 20
			},
			1400: {
				slidesPerView: 4,
				spaceBetween: 40
			},
			1919: {
				spaceBetween: 10,
				slidesPerView: 5
			}
		}
	});

	var anythingSwiper = new Swiper('.anything-bottom-slider', {
		loop: true,
		spaceBetween: 10,
		slidesPerView: 4,
		init: false,
		navigation: {
			nextEl: '.anything-bottom-block .swiper-button-next',
			prevEl: '.anything-bottom-block .swiper-button-prev',
		},
		breakpoints: {
			1180: {
				slidesPerView: 2,
				spaceBetween: 20
			},
			1700: {
				spaceBetween: 10,
				slidesPerView: 3
			}
		}
	});

	if (window.innerWidth >= 1100) {
		advantages.init();
		if (document.querySelector('.initPage')) {
			anythingSwiper.init();
		}
	}

	new Swiper('.metr-slider', {
		loop: true,
		spaceBetween: 10,
		slidesPerView: 9,
		navigation: {
			nextEl: '.metr-slider-inner .swiper-button-next',
			prevEl: '.metr-slider-inner .swiper-button-prev',
		},
		breakpoints: {
			499: {
				slidesPerView: 1,
				spaceBetween: 0
			},
			600: {
				slidesPerView: 2,
				spaceBetween: 0
			},
			991: {
				slidesPerView: 3,
				spaceBetween: 20
			},
			1200: {
				slidesPerView: 4,
				spaceBetween: 20
			},
			1400: {
				spaceBetween: 5,
				slidesPerView: 5
			},
			1600: {
				spaceBetween: 10,
				slidesPerView: 6
			},
			1919: {
				spaceBetween: 10,
				slidesPerView: 7
			}
		}
	});


	new Swiper('.category-slider', {
		loop: true,
		spaceBetween: 10,
		slidesPerView: 1,
		navigation: {
			nextEl: '.category-slider .swiper-button-next',
			prevEl: '.category-slider .swiper-button-prev',
		}
	});

	$('.category-select-one').selectric();
	$('.category-select-two').selectric();
	$('.feedback-select-one').selectric();
	$('.feedback-select-two').selectric();
	$('.centers-select1').selectric();
	$('.centers-select2').selectric();
	$('.centers-select3').selectric();


	$('.centers-select1').selectric().on('change', function () {
		let link = $(this)[0].selectedOptions[0].dataset.href;

		document.location.href = link;
	});

	$('.centers-select2').selectric().on('change', function () {
		let link = $(this)[0].selectedOptions[0].dataset.href;

		document.location.href = link;
	});

	$('.centers-select3').selectric().on('change', function () {
		let link = $(this)[0].selectedOptions[0].dataset.href;

		document.location.href = link;
	});

});

let questions = document.querySelectorAll('.anything-bottom-item h3 span');
questions.forEach((item) => {
	item.addEventListener('mouseover', function () {
		item.parentElement.parentElement.querySelector('.tooltip').style.display = "block";
	});

	item.addEventListener('mouseout', function () {
		item.parentElement.parentElement.querySelector('.tooltip').removeAttribute('style');
	});
});

let btn = document.querySelectorAll('.next');

btn.forEach((item) => {
	item.addEventListener('click', function (e) {
		e.preventDefault();

		let hideText = item.parentElement.parentElement.querySelector('.hide');
		console.log(hideText);

		hideText.classList.toggle('hide-active');
		this.style.display = "none";
		item.parentElement.querySelector('.points').style.display = 'none';
	});
});

window.addEventListener('resize', function () {
	let width = this.innerWidth;

	if (width > 768) {
		document.querySelector('.points').removeAttribute('style');
		document.querySelector('.next').removeAttribute('style');
		document.querySelector('.text .hide').classList.remove('hide-active');
	}
});




