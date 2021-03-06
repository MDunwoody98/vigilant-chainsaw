<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>BattleShips!</title>
        <link href="https://fonts.googleapis.com/css2?family=Pirata+One&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300&family=Pirata+One&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="css/styles.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script>
            let gameMode = "multiPlayer"
        </script>
        <script src="js/index.js"></script>
    </head>
    <body>
    <div class="title container">
            <h1>Battleships</h1>
        </div>
        <div class="container">
            <div class="player p1">
                Player 1
                <div class="connected">Connected</div>
                <div class="ready">Ready</div>
            </div>
            <div class="player p2">
                Player 2
                <div class="connected">Connected</div>
                <div class="ready">Ready</div>
            </div>
        </div>
        <div class="container">
            <div class="grid grid-user"></div>
            <div class="grid grid-computer"></div>
        </div>
        <div class="container game-options">
            <div class="buttons">
                <button id="start">Start Game</button>
                <button id="rotate">Rotate Your Ships</button>
            </div>
            <h3 id="turn" class="info">Your Turn</h3>
            <h3 id="info" class="info"></h3>
        </div>
        <div class="container">
            <div class="grid-display">
                <div class="ship destroyer-container" draggable="true">
                    <div id="destroyer-0"></div>
                    <div id="destroyer-1"></div>
                </div>
                <div class="ship submarine-container" draggable="true">
                    <div id="submarine-0"></div>
                    <div id="submarine-1"></div>
                    <div id="submarine-2"></div>
                </div>
                <div class="ship cruiser-container" draggable="true">
                    <div id="cruiser-0"></div>
                    <div id="cruiser-1"></div>
                    <div id="cruiser-2"></div>
                </div>
                <div class="ship battleship-container" draggable="true">
                    <div id="battleship-0"></div>
                    <div id="battleship-1"></div>
                    <div id="battleship-2"></div>
                    <div id="battleship-3"></div>
                </div>
                <div class="ship carrier-container" draggable="true">
                    <div id="carrier-0"></div>
                    <div id="carrier-1"></div>
                    <div id="carrier-2"></div>
                    <div id="carrier-3"></div>
                    <div id="carrier-4"></div>
                </div>
            </div>  
        </div>
    </body>
</html>