<?php
session_start();
const HIT = "hit";
const MISS = "miss";
$data = [];
$board = [];
$message;

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
    //If the class array associated with this index has includes hit or miss, indicating it's already been clicked, inform the user
    if (in_array(HIT,$classListOfTargetedSquare)) $message = "You have already hit this square";
    elseif (in_array(MISS,$classListOfTargetedSquare)) $message = "You have already missed this square";
    //Otherwise, if the array is not empty, we know the player has hit a ship
    elseif (sizeof($classListOfTargetedSquare) > 0) array_push($board[$targetedSquare], HIT);
    //Otherwise, the array is empty, indicating that the shot missed
    else array_push($board[$targetedSquare], MISS);
    //Update board and return a list of classes associated with this square
    $_SESSION["board"] = $board;
    $data[0] = $board[$targetedSquare];
    $data[1] = isset($message) ? $message : null;
    echo json_encode($data);
}
else echo json_encode("Error");
