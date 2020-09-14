$(document).ready(function () {

	var owl = $('.owl-carousel2'),
		owl2 = $('.owl-carousel3');

	owl.owlCarousel({
		loop: true,
		margin: 0,
		nav: false,
		dots: false,
		responsive: {
			0: {
				items: 1
			}
		}
	});

	$(".different_size .owl-next").on('click', function () {
		owl.trigger("next.owl.carousel");
	});

	$(".different_size .owl-prev").on('click', function () {
		owl.trigger("prev.owl.carousel");
	});


	owl2.owlCarousel({
		loop: true,
		margin: 0,
		nav: false,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			992: {
				items: 2
			},
			1200: {
				items: 3
			}
		}
	});

	$(".slider--next").click(function () {
		owl2.trigger("next.owl.carousel");
	});
	$(".slider--prev").click(function () {
		owl2.trigger("prev.owl.carousel");
	});


});

window.onload = function () {

	let burger = document.querySelector('.js-burger'),
		menu = document.querySelector('.js-main-nav--menu');

	burger.addEventListener('click', function () {
		this.classList.toggle('close');

		menu.classList.toggle('block');
	});

	let blockForMap = document.querySelector('.blockForMap').offsetTop,
		newMap = document.querySelector('.new-map');

	window.addEventListener('scroll', function () {

		if (pageYOffset >= blockForMap) {

			newMap.setAttribute("src", "https://api-maps.yandex.ru/2.1/?7293582a-d52e-4d29-9127-18e638c44040&lang=ru_RU");

			setTimeout(function () {
				ymaps.ready(init);

				function init() {

					var myMap = new ymaps.Map("map", {

						center: [55.73832132, 37.53982340],

						zoom: 18,
						controls: []
					}, {
						suppressMapOpenBlock: true
					});

					var myPlacemark = new ymaps.Placemark([55.73832744, 37.54116392], {}, {
						iconLayout: 'default#image',
						iconImageHref: 'img/pinmap.png',
						iconImageSize: [40, 40],
						iconImageOffset: [-3, -42]
					});

					myMap.geoObjects.add(myPlacemark);
				}
			}, 500);
			return;
		}

	});

}