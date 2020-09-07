$(document).ready(function () {
	$('.burger').on('click', function () {
		$(this).toggleClass('burger_active');
		$('.header__right').slideToggle();
	});

	setTimeout(function () {
		$('.header-slider select').each(function () {
			$(this).selectric();
			console.log(this);
		});
	}, 100)

	$('.order .order-container select').selectric();
});

window.onload = function () {

	//!СЛАЙДЕР ДЛЯ ШАПКИ
	let headerSlider = new Swiper('.header-slider', {
		init: false,
		loop: true,
		onlyExternal: true,

		navigation: {
			nextEl: '.header-slider .swiper-button-next',
			prevEl: '.header-slider .swiper-button-prev',

		}
	});

	//!СЛАЙДЕР ДЛЯ SPECIALISTS
	new Swiper('.specialists-slider', {
		loop: true,
		spaceBetween: 20,
		slidesPerView: 2,

		navigation: {
			nextEl: '.specialists-block .swiper-button-next',
			prevEl: '.specialists-block .swiper-button-prev',
		},
		breakpoints: {
			500: {
				slidesPerView: 1.4
			},

			900: {
				slidesPerView: 2
			},

			1099: {
				slidesPerView: 3
			}
		}
	});

	//!СЛАЙДЕР ДЛЯ SITUATION
	let situationSlider = new Swiper('.situation-slider', {
		init: false,
		loop: true,
		spaceBetween: 20,
		slidesPerView: 4,

		navigation: {
			nextEl: '.situation-block .swiper-button-next',
			prevEl: '.situation-block .swiper-button-prev',
		},
		breakpoints: {
			1279: {
				slidesPerView: 2
			},

			1399: {
				slidesPerView: 3
			},

			1919: {
				slidesPerView: 3
			}
		}
	});

	//!СЛАЙДЕР ДЛЯ STAGES
	let stagesSlider = new Swiper('.stages-slider', {
		init: false,
		loop: true,
		spaceBetween: 20,
		slidesPerView: 1,

		navigation: {
			nextEl: '.stages-block .swiper-button-next',
			prevEl: '.stages-block .swiper-button-prev',
		}
	});


	if (this.innerWidth >= 1100) {
		headerSlider.init();
	}

	if (this.innerWidth >= 992) {
		situationSlider.init();
	}

	if (this.innerWidth >= 1280) {
		stagesSlider.init();
	}


	this.addEventListener('resize', function () {
		if (this.innerWidth >= 992) {
			situationSlider.init();
		}

		if (this.innerWidth >= 1100) {
			headerSlider.init();
		}

		if (this.innerWidth >= 1280) {
			stagesSlider.init();
		}
	});

	//!КАРТА
	let countForMap = 0,
		offsetTopMap = document.querySelector('.map').offsetTop;

	// clientHeightMap = document.querySelector('#my-map').clientHeight;

	//Загружать карту при загрузе html если (высота до карты - высота карты - место скрола <= высоты экрана)
	window.onload = function () {
		// if (offsetTopMap - clientHeightMap - this.pageYOffset <= this.innerHeight) {
		// 	createScriptTag();
		// 	unicMap();
		// }
	}

	//Загружать карту при скроле страницы (скролл >= высоты до карты - высота экрана)
	window.onscroll = function () {
		// if ((this.pageYOffset >= (document.querySelector('.my-map').offsetTop) - this.innerHeight) && countForMap == 0) {
		// 	createScriptTag();
		// 	unicMap();
		// 	countForMap++;
		// }
	}

	//Создание тега скрипта
	function createScriptTag() {
		let tagScript = document.createElement('script'),
			apiKey = '7293582a-d52e-4d29-9127-18e638c44040';

		tagScript.setAttribute('src', 'https://api-maps.yandex.ru/2.1/?apikey=' + apiKey + '&lang=ru_RU');
		tagScript.setAttribute('async', 'async');
		document.querySelector('body').appendChild(tagScript);
	}

	//Создание Карты
	function unicMap() {
		setTimeout(function () {
			ymaps.ready(init);

			function init() {
				var myMap = new ymaps.Map("map", {
					center: [55.740730, 37.635000],
					controls: ['zoomControl', 'geolocationControl'],
					zoom: 11
				},
					myPlacemarkWithContent = new ymaps.Placemark([55.740730, 37.635000], {}, {
						// Опции.
						// Необходимо указать данный тип макета.
						iconLayout: 'default#imageWithContent',
						// Своё изображение иконки метки.
						iconImageHref: 'img/baloon.png',
						// Размеры метки.
						iconImageSize: [100, 128],
						// Смещение левого верхнего угла иконки относительно
						// её "ножки" (точки привязки).
						iconImageOffset: [-45, -115],
						// Смещение слоя с содержимым относительно слоя с картинкой.
						iconContentOffset: [15, 15],
					})

				);

				myMap.geoObjects
					.add(myPlacemarkWithContent);
				myMap.behaviors.disable('scrollZoom');
			}
		}, 500);
	}

	createScriptTag();
	unicMap();

	//!АККОРДЕОН
	let buttonsQuestions = document.querySelectorAll('.questions-button');

	buttonsQuestions.forEach((item) => {
		item.addEventListener('click', function (e) {
			e.preventDefault();

			$(item).parent().parent().find('p').slideToggle();
			this.classList.toggle('button-rotate');
		});
	});

	//!ПОКАЗ И СКРЫТИЕ ТЕКСТА
	let btnForText = document.querySelectorAll('a.show');

	btnForText.forEach((item) => {
		item.addEventListener('click', function (e) {
			e.preventDefault();

			this.style.display = "none";
			this.nextElementSibling.classList.add('hide_on');
		});
	});


}
