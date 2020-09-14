$(document).ready(function () {
	$('.address').selectric();
	$('.form-inner select').selectric();

	$('.header-left button').on('click', function () {
		$('.header-right').slideToggle();

		if ($(this).find('img').attr('src') == 'img/burger.png') {
			$(this).find('img').attr('src', 'img/close.png');
		} else {
			$(this).find('img').attr('src', 'img/burger.png');
		}
	});

	$('.header-links-mobile h2').each(function () {
		$(this).on('click', function () {
			$(this).next().slideToggle();
		});
	});
});

window.onload = function () {
	let titleHover = document.querySelectorAll('.header-bottom-item');

	titleHover.forEach((item) => {
		item.addEventListener('mouseover', function () {
			item.querySelector('h2').style.borderBottom = "3px solid #465dd6";
			item.querySelector('.header-bottom-sub').classList.add('header-bottom-sub_block');
		});

		item.addEventListener('mouseout', function () {
			item.querySelector('h2').removeAttribute('style');
			item.querySelector('.header-bottom-sub').classList.remove('header-bottom-sub_block');
		});
	});


	new Swiper('.cart-slider', {
		loop: true,
		spaceBetween: 20,

		pagination: {
			el: '.cart .swiper-pagination',
			type: 'bullets',
			clickable: true,
		},

		navigation: {
			nextEl: '.cart .swiper-button-next',
			prevEl: '.cart .swiper-button-prev',
		}
	});

	new Swiper('.order-slider', {
		loop: true,
		spaceBetween: 20,

		pagination: {
			el: '.swiper-pagination',
			type: 'bullets',
			clickable: true,
		},

		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		}
	});

	new Swiper('.license-slider', {
		loop: true,
		spaceBetween: 20,
		slidesPerView: 1,

		pagination: {
			el: '.license .swiper-pagination',
			type: 'bullets',
			clickable: true,
		},

		navigation: {
			nextEl: '.license .swiper-button-next',
			prevEl: '.license .swiper-button-prev',
		},
		breakpoints: {
			600: {
				slidesPerView: 2
			},
			768: {
				slidesPerView: 3
			},
			1100: {
				slidesPerView: 4
			},
			1400: {
				slidesPerView: 5
			}
		}
	});

	let advantagesSlider = new Swiper('.advantages-slider', {
		loop: true,
		spaceBetween: 20,
		slidesPerView: 1,
		init: false,

		navigation: {
			nextEl: '.advantages .swiper-button-next',
			prevEl: '.advantages .swiper-button-prev',
		},
		breakpoints: {
			600: {
				slidesPerView: 2
			},
			768: {
				slidesPerView: 3
			},
			1100: {
				slidesPerView: 4
			},
		}
	});

	window.addEventListener('resize', function () {
		if (window.innerWidth >= 1100) {
			advantagesSlider.init();
		}
	});

	if (window.innerWidth >= 1100) {
		advantagesSlider.init();
	}

	let btnText = document.querySelectorAll('.button-text');

	btnText.forEach((item) => {
		item.addEventListener('click', function (e) {
			e.preventDefault();

			this.nextElementSibling.style.display = 'inline';
			this.style.display = 'none';
		});
	});


	let tabLinks = document.querySelectorAll('.tab-list a'),
		tabItems = document.querySelectorAll('.tab-bottom__item');

	tabItems[0].classList.add('tab-bottom__item_block', 'tab-bottom__item_opacity');
	tabLinks[0].classList.add('tab-active');


	tabLinks.forEach((item, index) => {
		item.addEventListener('click', function (e) {
			e.preventDefault();
			changeTab.call(item);
		});
	});

	function changeTab() {
		let linkHref = this.getAttribute('href');

		tabItems.forEach((item) => {
			item.classList.remove('tab-bottom__item_block', 'tab-bottom__item_opacity');
		});

		tabLinks.forEach((item, index) => {
			item.classList.remove('tab-active');
		});

		this.classList.add('tab-active');
		document.querySelector(linkHref).classList.add('tab-bottom__item_block');

		setTimeout(function () {
			document.querySelector(linkHref).classList.add('tab-bottom__item_opacity');
		}, 100)
	}

	let sliders = document.querySelectorAll('.our-centers-slider');

	sliders.forEach((item) => {
		new Swiper(item, {
			loop: true,
			spaceBetween: 0,
			slidesPerView: 1,
			observer: true,
			observeParents: true,

			navigation: {
				nextEl: item.parentElement.querySelector('.swiper-button-next'),
				prevEl: item.parentElement.querySelector('.swiper-button-prev'),
			},

			breakpoints: {
				1280: {
					slidesPerView: 2
				}
			},

			pagination: {
				el: item.parentElement.querySelector('.swiper-pagination'),
				type: 'bullets',
				clickable: true,
			},

		});

	});


}



