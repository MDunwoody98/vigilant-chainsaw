<?php
session_start();
$width = $_SESSION["width"];
//This function will generate the AIs ships and place them on the board of the provided width
unset($_SESSION["board"]);
$opponentSquares = [];

for ($i=0; $i < $width ** 2; $i++)
{ 
    $opponentSquares[$i] = [];
}
//declare array of ships
$shipArray = [
    [
        "name" => "destroyer",
        "directions" => [
            [0,1],
            [0,$width]
        ]
    ],
    [
        "name" => "cruiser",
        "directions" => [
            [0,1,2],
            [0,$width,$width*2]
        ]
    ],
    [
        "name" => "submarine",
        "directions" => [
            [0,1,2],
            [0,$width,$width*2]
        ]
    ],
    [
        "name" => "battleship",
        "directions" => [
            [0,1,2,3],
            [0,$width,$width*2,$width*3]
        ]
    ],
    [
        "name" => "carrier",
        "directions" => [
            [0,1,2,3,4],
            [0,$width,$width*2,$width*3,$width*4]
        ]
    ]
];
//Generate all ships on a grid of size $width ** 2
function generate($ship, $width, &$opponentSquares){
    //0 or 1 - horizontal or vertical
    $randomDirection = rand(0,1);
    //Orientation will be the values for the specific ship's horizontal or vertical squares 
    $chosenOrientation = $ship["directions"][$randomDirection];
    //If horizontal, set direction to 1. If horizontal set to 10. This value is used to paint the ships on grid
    $direction = $randomDirection == 0 ? 1 : $width;
    //Start position for ship. Random square on grid take away the ship direction's length * direction
    //horizontal - cruiser will have 3 subtracted. For vertical it will have 30 subtracted as it cannot start on cells 71-100
    //This allows the ship to be wholly painted onto the grid from assigning a "safe" start position that won't overflow
    $randomStartPosition = floor(rand(0,(sizeof($opponentSquares) - sizeof($ship["directions"][0]) * $direction)));
    //Make sure square is not already taken by other ship
    //for each square that would be consumed by the current ship at its chosen orientation,
    //check the grid for the AI's ship positions, starting at randomStartPosition.
    //If any of the squares contains a class of "taken" then a different random start position must be used
    $isTaken = false;
    foreach ($chosenOrientation as $index) {
        if (in_array("taken",$opponentSquares[$randomStartPosition + $index])) $isTaken = true;
    }
    //assume width is 10 for a 10x10 grid. Check the start position - should be from 1-100
    //Check each square that the ship will occupy. If that square's index % width is equal to width-1, it is on the right edge
    //Exception if the index is the final one of the ship, as that is fine to be in the rightmost column
    $isAtRightEdge = false;
    foreach (array_slice($chosenOrientation,0,-1) as $index) {
        if (($randomStartPosition + $index % $width) === $width -1) $isAtRightEdge = true;
    }
    //Check if ship will be on left edge if any of its squares' (indices % width) equal 0
    //Exception if the index is the first one of the ship, as that is fine to be in the leftmost column
    $isAtLeftEdge = false;
    foreach (array_slice($chosenOrientation,1) as $index) {
        if ($randomStartPosition + $index % $width === 0) $isAtLeftEdge = true;
    }
    //If all these are good, ship is painted onto the board. Otherwise, run function again to try a different position
    if (!$isTaken && !$isAtRightEdge && !$isAtLeftEdge)
    {
        foreach ($chosenOrientation as $index) 
        {
            array_push($opponentSquares[$randomStartPosition + $index], "taken", $ship["name"]);
        }
    }
    else generate($ship, $width, $opponentSquares);
}

if (!isset($_SESSION["board"])) {
    foreach ($shipArray as $ship) {
        generate($ship, $width, $opponentSquares);
    }
    $_SESSION["board"] = $opponentSquares;
}
//Otherwise do nothing here
echo json_encode($opponentSquares);










//check that we received a post req and that the request contained data for grid size to init board dimensions
// if ($_SERVER["REQUEST_METHOD"] == "POST" && !empty($_POST["gridSize"])) {
//     $jsonData = json_decode($_POST["gridSize"]);
//     $gridSize = $jsonData->$gridSize;
// }

// if (!isset($_SESSION["game"])) {
//     //start new game
//     initGame($gridSize);
// }
// else {
//     //continue game
//     $board = $_SESSION["game"]["board"];
// }
// echo json_encode(['game' => $_SESSION["game"]]);

// function initGame($gridSize) {
//     $_SESSION["game"] = array("board"=>null);
//     global $board;

//     //create empty board
//     $board = array_fill(0,$s,array_fill(0,$s,"#"));//this logic will need updated to reflect the client side test code

//     //place ship
// }
?>