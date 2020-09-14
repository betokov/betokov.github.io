var init = function() {


	var krest = document.getElementById('krest');
	var wall = document.getElementById('wall');
	var order = document.getElementsByClassName('js-order');
	
	console.log(order);

	for (var i = 0; i < order.length ; i++) {
		order[i].addEventListener('click', modalIn);
	}



	krest.addEventListener('click', modalOut);
	wall.addEventListener('click', wallOut);

}

//CLOSE MODAl 
function wallOut() {
	var modal = document.getElementById('modal');
	var wall = document.getElementById('wall');
	var body = document.getElementsByTagName('body');


	body[0].removeAttribute('style');
	wall.removeAttribute('style');
	modal.removeAttribute('style');
}

function modalOut() {
	var modal = document.getElementById('modal');
	var wall = document.getElementById('wall');
	var body = document.getElementsByTagName('body');


	body[0].removeAttribute('style');
	wall.removeAttribute('style');
	modal.removeAttribute('style');
}


//SHOW MODAl
function modalIn() {
	var modal = document.getElementById('modal');
	var wall = document.getElementById('wall');
	var body = document.getElementsByTagName('body');

	wall.style.display = "block";
	modal.style.opacity = "1";
	body[0].style.overflowY = "hidden";
}



window.onload = init;


$(function() {
	$('#burger').click(function(){
		$('#navbarNav').slideToggle();
	});
});
