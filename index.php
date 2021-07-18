<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>BattleShips!</title>
        <link rel="stylesheet" href="css/styles.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
        <script src="js/index.js"></script>
    </head>
    <body>
    <div class="container">
        <div class="grid grid-user"></div>
        <div class="grid grid-computer"></div>
    </div>
    <div class="hidden-info">
        <button id="start">Start Game</button>
        <button id="rotate">Rotate Your Ships</button>
        <h3 id="turn">Your Turn</h3>
        <h3 id="info"></h3>
    </div>
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
    <?php
        echo '<p>Your order is as follows: </p>';
        echo htmlspecialchars($tireQty) . ' tires<br />';
        echo htmlspecialchars($oilQty) . ' bottles of oil<br />'; echo htmlspecialchars($sparkQty) . ' spark plugs<br />';
    ?>
    </body>
</html>