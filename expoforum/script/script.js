window.addEventListener("DOMContentLoaded", function() {
    let burger = document.querySelector(".js-burger");
    let menu = document.querySelector(".header__navigation");

    burger.addEventListener("click", function() {
        menu.classList.toggle("header__navigation_show");
    })
})