<?php
session_start();
//header("Content-Type: text/plain");
$_SESSION['variable'] = "test";
require_once('Ship.php');

$board;
$ships;
$gridSize;
//declare array of ships
$shipArray = [
    [
        "name" => "destroyer",
        "directions" => [
            [0,1],
            [0,width]
        ]
    ],
    [
        "name" => "cruiser",
        "directions" => [
            [0,1,2],
            [0,width,width*2]
        ]
    ],
    [
        "name" => "submarine",
        "directions" => [
            [0,1,2],
            [0,width,width*2]
        ]
    ],
    [
        "name" => "battleship",
        "directions" => [
            [0,1,2,3],
            [0,width,width*2,width*3]
        ]
    ],
    [
        "name" => "carrier",
        "directions" => [
            [0,1,2,3,4],
            [0,width,width*2,width*3,width*4]
        ]
    ]
];


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