<?php

$name = $_POST['name'];
$from = $_POST['email'];
$phone = $_POST['phone'];
$title = 'Заказ звонка';

$msg = "Имя : $name \n Телефон: $phone \n Email: $email";
echo "$name $from $phone";
mail('web_masters_07@mail.ru', $title, $msg, 'From: '.$from);

?>