/*TIMER
*************************************/
var myTimer = document.getElementById('timer'),
hour = myTimer.querySelector('.hour'),
minutes = myTimer.querySelector('.minutes'),
seconds = myTimer.querySelector('.seconds');



function timer(h, m, s) {
	tHour = +h;
	tMinutes = +m;
	tSeconds = +s;

	if(tHour < 10){
		hour.innerHTML = '0'+tHour;
	}  else{
		hour.innerHTML = tHour;
	}

	if(tMinutes < 10) {
		minutes.innerHTML = '0'+tMinutes;
	}  else{
		minutes.innerHTML = tMinutes;
	}

	if(tSeconds < 10) {
		seconds.innerHTML = '0'+tSeconds;
	}  else{
		seconds.innerHTML = tSeconds;
	}



	var myTimers = setInterval(function() {

		--tSeconds;

		if(tHour == 0 && tMinutes == 0 && tSeconds == 0) {
			clearInterval(myTimers);
		}


		if(tSeconds < 0) {
			--tMinutes;
			minutes.innerHTML = tMinutes;
			tSeconds = 59;
		}

		if(tMinutes < 0) {
			--tHour;
			hour.innerHTML = tHour;
			tMinutes = 59;
		}


		if(tHour < 10){
			hour.innerHTML = '0'+tHour;
		} else {
			hour.innerHTML = tHour;
		}
		if(tMinutes < 10){
			minutes.innerHTML = '0'+tMinutes;
		} else {
			minutes.innerHTML = tMinutes;
		}
		if(tSeconds < 10){
			seconds.innerHTML = '0'+tSeconds;
		} else {
			seconds.innerHTML = tSeconds;
		}




	}, 1000);


}

timer(15, 48, 27);

var myTimer2 = document.getElementById('timer2'),
hour2 = myTimer2.querySelector('.hour'),
minutes2 = myTimer2.querySelector('.minutes'),
seconds2 = myTimer2.querySelector('.seconds');



function timer2(h, m, s) {
	tHour2 = +h;
	tMinutes2 = +m;
	tSeconds2 = +s;

	if(tHour2 < 10){
		hour2.innerHTML = '0'+tHour2;
	}  else{
		hour2.innerHTML = tHour2;
	}

	if(tMinutes2 < 10) {
		minutes2.innerHTML = '0'+tMinutes2;
	}  else{
		minutes2.innerHTML = tMinutes2;
	}

	if(tSeconds2 < 10) {
		seconds2.innerHTML = '0'+tSeconds2;
	}  else{
		seconds2.innerHTML = tSeconds2;
	}



	var myTimers2 = setInterval(function() {

		--tSeconds2;

		if(tHour2 == 0 && tMinutes2 == 0 && tSeconds2 == 0) {
			clearInterval(myTimers2);
		}


		if(tSeconds2 < 0) {
			--tMinutes2;
			minutes2.innerHTML = tMinutes2;
			tSeconds2 = 59;
		}

		if(tMinutes2 < 0) {
			--tHour2;
			hour2.innerHTML = tHour2;
			tMinutes2 = 59;
		}


		if(tHour2 < 10){
			hour2.innerHTML = '0'+tHour2;
		} else {
			hour2.innerHTML = tHour2;
		}
		if(tMinutes2 < 10){
			minutes2.innerHTML = '0'+tMinutes2;
		} else {
			minutes2.innerHTML = tMinutes2;
		}
		if(tSeconds2 < 10){
			seconds2.innerHTML = '0'+tSeconds2;
		} else {
			seconds2.innerHTML = tSeconds2;
		}




	}, 1000);


}

timer2(15, 48, 27);



/*MODALS
***********************************************************/
var btn = document.querySelectorAll('.js-call'),
btn_thanks = document.querySelectorAll('.js-thanks'),
modal = document.querySelector('.js-modal-call'),
modalThanks = document.querySelector('.js-modal-thanks'),
line = document.createElement('div'),
formCall = document.form_call;

line.className = 'line js-line';




/*VALIDATE EMAIL*/
function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email);
}


/*VALIDATE PHONE*/
function validatePhone(phone) {
	var re = /^\+\d{1}\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
	return re.test(phone);
}

/*MASK PHONE*/
function maskPhone() {
	if(formCall.phone.value == '') {
		var mask = '+7(___)___-__-__';
		formCall.phone.value = mask;
	}
}


/*DEL MASK PHONE*/
function maskDel() {
	if(formCall.phone.value == '+7(___)___-__-__') formCall.phone.value = '';
}


/*MASK PHONE CHANGE*/
function setCursorPosition(pos, elem) {

	elem.focus();

	if (elem.setSelectionRange) elem.setSelectionRange(pos, pos);

	else if (elem.createTextRange) {

		var range = elem.createTextRange();

		range.collapse(true);

		range.moveEnd("character", pos);

		range.moveStart("character", pos);

		range.select()

	}

}


function mask(event) {
	console.log(this);
	var matrix = this.getAttribute('data-mask'),
	i = 0,
	def = matrix.replace(/\D/g, ""),
	val = this.value.replace(/\D/g, "");

	def.length >= val.length && (val = def);

	matrix = matrix.replace(/[_\d]/g, function(a) {

		return val.charAt(i++) || "_"

	});

	this.value = matrix;

	i = matrix.lastIndexOf(val.substr(-1));

	i < matrix.length && matrix != this.defaultValue ? i++ : i = matrix.indexOf("_");

	setCursorPosition(i, this);

}



formCall.phone.addEventListener("input", mask, false);
formCall.phone.addEventListener("focus", maskPhone, false);
formCall.phone.addEventListener("blur", maskDel, false);






/*CLOSE MODAL*/
function closeModal() {

	var line = document.querySelector('.js-line');


	document.body.style.overflow = "visible";
	document.body.removeChild(line);


	if(modal.hasAttribute('class', 'showModal')){
		modal.classList.remove('showModal');

		if(document.querySelector('.error')) {
			var elem = document.querySelector('.error');
			elem.remove();
		}

	}

	if(modalThanks.hasAttribute('class', 'showModal')){
		modalThanks.classList.remove('showModal')
	}


}


/*CHECK FORM*/
function checkForm(e) {

	e.preventDefault();

	if((formCall.name.value != '') && (formCall.phone.value != '') && (formCall.email.value != '')) {

		if(validatePhone(formCall.phone.value) && validateEmail(formCall.email.value)) {

			var request = new XMLHttpRequest(),
			params = 'name=' + formCall.name.value + '&phone=' + formCall.phone.value + '&email=' + formCall.email.value;

			request.onreadystatechange = function() {

				if(request.readyState == 4 && request.status == 200) {

					formCall.name.value = '';
					formCall.phone.value = '';
					formCall.email.value = '';

					modal.classList.remove('showModal');
					modalThanks.classList.add('showModal');

					var close = document.querySelector('.js-close2');
					close.addEventListener('click', closeModal);

				}

			}
			request.open("POST", "mail.php", true);
			request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			request.send(params);


		} else {

			if(!document.querySelector('.error')) {
				var error = document.createElement('div');
				error.classList.add('error');
				error.textContent = 'Заполните пожалуйста все поля!';

				formCall.insertBefore(error, formCall.querySelector('h1').nextSibling);
			}

		}

	} else {
		if(!document.querySelector('.error')) {
			var error = document.createElement('div');
			error.classList.add('error');
			error.textContent = 'Заполните пожалуйста все поля!';

			formCall.insertBefore(error, formCall.querySelector('h1').nextSibling);
		}
	}


}


/*MODAL THANKS*/
function openThanks(e) {

	e.preventDefault();

	modal.classList.remove('showModal');
	modalThanks.classList.add('showModal');

	var close = document.querySelector('.js-close2');
	close.addEventListener('click', closeModal);

}


/*OPEN MODAL*/
function openCall() {


	var send = document.querySelector('.js-send');


	document.body.appendChild(line);

	modal.classList.add('showModal');
	document.body.style.overflow = "hidden";

	var close = document.querySelector('.js-close');
	close.addEventListener('click', closeModal, false);
	line.addEventListener('click', closeModal, false);


	send.addEventListener('click', checkForm, false);

}



/*BTN MODALS*/
btn.forEach(function(btn) {
	btn.addEventListener('click', openCall, false);
});


btn_thanks.forEach(function(btn) {
	btn.addEventListener('click', checkForm, false);
});






