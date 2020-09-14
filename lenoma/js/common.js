$(document).ready(function() {


	$(".burger_top").click(function() {
		$(".top_menu").slideToggle();
	});


	$(".burger_bottom").click(function() {
		$(".bottom_menu .menu").slideToggle();
	});


	var owl = $(".owl-carousel1");
	owl.owlCarousel({
		loop:true,
		margin:10,
		nav: true,
		navText:['<span class="left"></span>','<span class="right"></span>'],
		responsive:{
			0:{
				items:1
			},
			768:{
				items:2
			},
			992:{
				items:4
			},
			1200:{
				items:4
			}
		}
	});


	var owl = $(".owl-carousel2");
	owl.owlCarousel({
		loop:true,
		margin:10,
		nav:true,
		navText:['<span class="left"></span>','<span class="right"></span>'],
		responsive:{
			0:{
				items:1
			},
			450:{
				items:2
			},
			768:{
				items:3
			},
			992:{
				items:5
			},
			1200:{
				items:5
			}
		}
	});



	$('.owl-nav').removeAttr("class", "disabled");

	var owl = $(".owl-carousel3");
	owl.owlCarousel({
		loop:true,
		margin:10,
		dots: true,
		responsive:{
			0:{
				items:1
			}
		}
	});

})