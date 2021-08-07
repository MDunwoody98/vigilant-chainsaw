<?php
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST" && !empty($_POST["board"]))
{
    $_SESSION["userBoard"] = json_decode($_POST["board"]);
    echo json_encode($_SESSION["userBoard"]);
}
else echo "Error";
