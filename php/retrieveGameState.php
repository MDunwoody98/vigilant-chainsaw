<?php
session_start();
$data = [];

$enemyBoard = $_SESSION["board"];
$userBoard = $_SESSION["userBoard"];

if (!isset($_SESSION["board"]) || !isset($_SESSION["userBoard"])) {
    # both boards don't exist so there's no point returning a session. Return blank array
    echo json_encode("");
}
//Return both boards to the client if both exist
else {
    $data[0] = $userBoard;
    $data[1] = $enemyBoard;
    echo json_encode($data);
}