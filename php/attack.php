<?php
session_start();
$data = [];
$board = [];

//For attack to be processed, a board exist for the cpu 
if (!isset($_SESSION["board"])) 
{
    echo json_encode("Error");return;
}
else 
{
    $board = $_SESSION["board"];
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && !empty($_POST["target"]))
{
    //Decode data of the incoming attack launched by the player at the cpu-generated ship
    $jsonData = json_decode($_POST["target"]);
    $targetedSquare = $jsonData->target;
    $classListOfTargetedSquare = $board[$targetedSquare];
    //echo json_encode($classListOfTargetedSquare);
    //Otherwise, if the array is not empty, we know the player has hit a ship
    //client side validation prevents same square being clicked multiple times
    if (sizeof($classListOfTargetedSquare) > 0){
        array_push($board[$targetedSquare], "hit");
        $message = null;
    } 
    //Otherwise, the array is empty, indicating that the shot missed
    else {
        array_push($board[$targetedSquare], "miss");
        $message = null;
    }
    //Update board and return a list of classes associated with this square
    $_SESSION["board"] = $board;
    $data = $board[$targetedSquare];
    echo json_encode($data);
}
else echo json_encode("Error");
