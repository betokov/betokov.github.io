window.onload = function () {

	new Swiper('.certification-slider', {
		loop: true,
		spaceBetween: 20,
		slidesPerView: 6,
		observer: true,
		observeParents: true,

		navigation: {
			prevEl: '.certification-block .swiper-button-prev',
			nextEl: '.certification-block .swiper-button-next'
		},

		breakpoints: {
			450: {
				slidesPerView: 1.4
			},
			650: {
				slidesPerView: 2
			},
			900: {
				slidesPerView: 3
			},
			1099: {
				slidesPerView: 4
			},
			1279: {
				slidesPerView: 5
			}
		}
	});

	let advantagesSwiper = new Swiper('.advantages-slider', {
		loop: true,
		spaceBetween: 20,
		slidesPerView: 4,
		observer: true,
		observeParents: true,

		navigation: {
			prevEl: '.advantages-swiper-block .swiper-button-prev',
			nextEl: '.advantages-swiper-block .swiper-button-next'
		},

		pagination: {
			el: '.advantages-swiper-block .swiper-pagination',
			type: 'bullets',
			clickable: true
		},

		breakpoints: {
			600: {
				slidesPerView: 1
			},
			992: {
				slidesPerView: 2
			},
			1200: {
				slidesPerView: 3
			}
		}
	});

	if (window.innerWidth >= 1280) {
		advantagesSwiper.destroy();
	}

	window.addEventListener('resize', function () {
		if (this.innerWidth >= 1280) {
			advantagesSwiper.destroy();
		}
	});

	let oilSwiper = new Swiper('.oil-slider', {
		init: false,
		loop: true,
		spaceBetween: 20,
		slidesPerView: 3,
		observer: true,
		observeParents: true,

		navigation: {
			prevEl: '.oil-block .swiper-button-prev',
			nextEl: '.oil-block .swiper-button-next'
		},

		pagination: {
			el: '.oil-block .swiper-pagination',
			type: 'bullets',
			clickable: true
		},

		breakpoints: {
			600: {
				slidesPerView: 1
			},
			992: {
				slidesPerView: 2
			},
			1200: {
				slidesPerView: 3
			}
		}
	});

	if (window.innerWidth >= 1280) {
		oilSwiper.init();
	}

	window.addEventListener('resize', function () {
		if (this.innerWidth <= 1280) {
			oilSwiper.destroy();
		}
	});

	//SHOW TEXT
	if (document.querySelector('.why-description')) {
		let btnText = document.querySelector('.why-description .show');

		btnText.onclick = function () {
			this.style.display = 'none';
			document.querySelector('.why-description .hide').classList.add('show-text');
		}
	}

	//CHECKBOX
	let checkbox = document.querySelectorAll('.form__checkbox');

	checkbox.forEach((item) => {
		item.onclick = function () {
			document.querySelector('.form__label span').classList.toggle('form__checkbox_show');
		}
	});

	//MENU
	let btn = document.querySelectorAll('.mobile-block button');


	btn.forEach((item) => {
		item.onclick = function (e) {
			e.preventDefault();

			this.classList.toggle('active');
			$('.header-block').slideToggle();
		}
	});


} //!END ONLOAD