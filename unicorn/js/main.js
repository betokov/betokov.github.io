$(function(){

	/*HEADER MENU*/
	$('.js-burger').on("click", function(){

		$('.h-menu').slideToggle();
		$(this).toggleClass('fa-times');
		$(this).toggleClass('fa-bars');


	});//EMD CLICK


var owl = $(".owl-carousel1");
	owl.owlCarousel({
		loop:true,
		margin:10,
		nav:true,
		navText:['<span class="left"></span>','<span class="right"></span>'],
		responsive:{
			0:{
				items:1
			},
			700:{
				items:1
			},
			992:{
				items:1
			},
			1200:{
				items:3
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
			700:{
				items:1
			},
			992:{
				items:6
			}
		}
	});




});//END READY

