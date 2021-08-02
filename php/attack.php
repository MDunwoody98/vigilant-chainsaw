<?php
session_start();
define(MISS,"miss");//define this properly

$board;

if (!isset($_SESSION["game"])) {
    //start new game
    initGame($gridSize);
}
else {
    //continue game
    $board = $_SESSION["game"]["board"];
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && !empty($_POST["data"])) {

    //Decode data of the incoming attack
    $jsonData = json_decode($_POST["data"]);
    $encodedCoordinates = $jsonData->$id;
    $coordinates = explode("-",$encodedCoordinates);
    $result["id"] = $encodedCoordinates;
    $result["x"] = intval($coordinates[0]);
    $result["y"] = intval($coordinates[1]);//Will you do coordinates or just do a number??



    //Check if it hits
    $targetedCoordinate = $board[$result["x"]][$result["y"]];
    if ($targetedCoordinate != "#")
    {
        //Either a new hit or already missed or already hit
        if ($targetedCoordinate == MISS)
        {
            $result["message"] = "You have already missed this tile";
        }
        if ($targetedCoordinate == HIT)
        {
            $result["message"] = "You have already hit this tile";
        }
        else
        {
            $result["message"] = "You hit a ship!";//which one? Is the ship destroyed
            $result["status"] = "Hit";
            $board[$result["x"]][$result["y"]] = HIT;
        }
    }
    else
    {
        $result["message"] = "You missed, noob!!";
        $result["status"] = "Miss";
        $board[$result["x"]][$result["y"]] = MISS;
    }

    //update session
    $_SESSION["game"]["board"] = $board;

    //return result
    echo json_encode(['game' => $_SESSION["game"]]);
}