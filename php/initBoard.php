<?php
session_start();
//header("Content-Type: text/plain");
$_SESSION['variable'] = "test";

$board;
$ships;
$gridSize;

//check that we received a post req and that the request contained data for grid size to init board dimensions
if ($_SERVER["REQUEST_METHOD"] == "POST" && !empty($_POST["gridSize"])) {
    $jsonData = json_decode($_POST["gridSize"]);
    $gridSize = $jsonData->$gridSize;
}

if (!isset($_SESSION["game"])) {
    //start new game
    initGame($gridSize);
}
else {
    //continue game
    $board = $_SESSION["game"]["board"];
}

echo json_encode(['game' => $_SESSION["game"]]);

function initGame($gridSize) {
    $_SESSION["game"] = array("board"=>null);
    global $board;

    //create empty board
    $board = array_fill(0,$s,array_fill(0,$s,"#"));//this logic will need updated to reflect the client side test code

    //place ship
}
?>