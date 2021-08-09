$(function() {
    //Battleship logic
    const userGrid = $('.grid-user')
    const opponentGrid = document.querySelector('.grid-computer')
    const displayGrid = document.querySelector('.grid-display')
    const ships = $('.grid-display .ship')
    const destroyer = $('.destroyer-container')[0]
    const submarine = $('.submarine-container')[0]
    const cruiser = $('.cruiser-container')[0]
    const battleship = $('.battleship-container')[0]
    const carrier = $('.carrier-container')[0]
    const startButton = $('#start')
    const rotateButton = $('#rotate')
    const turnDisplay = $('#turn')
    const infoDisplay = $('#info')
    const grid = $(".grid")
    const buttons = $(".buttons")

    let userSquares = []
    const opponentSquares = []
    //variables to store ship being dragged
    let selectedShipAndIndex;
    let draggedShip;
    let draggedShipLength;
    //variables to store score
    let destroyerCount = 0
    let cruiserCount = 0
    let submarineCount = 0
    let battleshipCount = 0
    let carrierCount = 0
    let opponentDestroyerCount = 0
    let opponentCruiserCount = 0
    let opponentSubmarineCount = 0
    let opponentBattleshipCount = 0
    let opponentCarrierCount = 0

    //Ajax call to get width from php
    //For multiplayer, get this value from the socket server
    //Multiplayer version generates a new width each time the playerArray size is 0 on an onClose
    //And it generates a new width each time the playerArray size is 1 on onOpen
    jQuery.extend({
        getValues: function(url) {
            var result = null;
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                async: false,
                success: function(data) {
                    result = $.parseJSON(data);
                }
            });
           return result;
        }
    });
    let width = (gameMode == "singlePlayer")? $.getValues("../php/generateWidth.php") : -1;

    let isHorizontal = true;
    let isGameOver = false

    //Socket Connection variables
    let currentPlayer = 'user'//player 0 will go first
    let playerNum = 0;
    let ready = false;
    let enemyReady = false;
    let allShipsPlaced = false;
    let shotFired = -1;

    function resumeState(jsonObj){
        //userSquares - add entire class list to grid from php object
        //opponentSquares - add hit and miss classes that exist
        //current player - user always goes first so if count hit+miss is equal, it's the user's go
        //user Squares
        userHitMissCount = 0;
        cpuHitMissCount = 0;
        userStateArray = jsonObj[0]
        cpuStateArray = jsonObj[1]
        console.log(cpuStateArray)
        userArray = []
        cpuArray = []
        if (typeof(userStateArray) === undefined && typeof(cpuStateArray) === undefined) return;

        for (let index = 0; index < userStateArray.length; index++) {
            classArrayForSelectedTile = Object.values(userStateArray[index])
            if (classArrayForSelectedTile.length > 0) {
                userArray[index] = Object.values(userStateArray[index])
            }
            if (classArrayForSelectedTile.includes("miss")) {
                userHitMissCount++;
            }
            if (classArrayForSelectedTile.includes("hit")) {
                userHitMissCount++;
                if (classArrayForSelectedTile.includes("destroyer")) {
                    if (opponentDestroyerCount + 1 === 2) opponentDestroyerCount = 10
                    else opponentDestroyerCount++
                }
                if (classArrayForSelectedTile.includes("submarine")) {
                    if (opponentSubmarineCount + 1 === 3) opponentSubmarineCount = 10
                    else opponentSubmarineCount++
                }
                if (classArrayForSelectedTile.includes("cruiser")) {
                    if (opponentCruiserCount + 1 === 3) opponentCruiserCount = 10
                    else opponentCruiserCount++
                }
                if (classArrayForSelectedTile.includes("battleship")) {
                    if (opponentBattleshipCount + 1 === 4) opponentBattleshipCount = 10
                    else opponentBattleshipCount++
                }
                if (classArrayForSelectedTile.includes("carrier")) {
                    if (opponentCarrierCount + 1 === 5) opponentCarrierCount = 10
                    else opponentCarrierCount++
                }
            }
        }
        for (let index = 0; index < cpuStateArray.length; index++) {
            classArrayForSelectedTile = Object.values(cpuStateArray[index])
            if (classArrayForSelectedTile.includes("hit")){
                cpuHitMissCount++;
                cpuArray[index] = "hit";
                if (classArrayForSelectedTile.includes("destroyer")) {
                    if (destroyerCount + 1 === 2) destroyerCount = 10
                    else destroyerCount++
                }
                if (classArrayForSelectedTile.includes("submarine")) {
                    if (submarineCount + 1 === 3) submarineCount = 10
                    else submarineCount++
                }
                if (classArrayForSelectedTile.includes("cruiser")) {
                    if (cruiserCount + 1 === 3) cruiserCount = 10
                    else cruiserCount++
                }
                if (classArrayForSelectedTile.includes("battleship")) {
                    if (battleshipCount + 1 === 4) battleshipCount = 10
                    else battleshipCount++
                }
                if (classArrayForSelectedTile.includes("carrier")) {
                    if (carrierCount + 1 === 5) carrierCount = 10
                    else carrierCount++
                }
            }
            if (Object.values(cpuStateArray[index]).includes("miss")){
                cpuHitMissCount++;
                cpuArray[index] = "miss";
            }
        }
        //For each index with associated classes, add them to the user board
        userArray.forEach((value, key) => {
            if (!value.toString().includes(",")) userSquares[key].classList.add(value)
            else value.toString().split(",").forEach(element => userSquares[key].classList.add(element));
        });
        cpuArray.forEach((value, key) => {
            opponentSquares[key].classList.add(value)
        })
        if (userHitMissCount <= cpuHitMissCount){
            currentPlayer = "user"
        } 
        else currentPlayer = "enemy"
        //make sure user can't drag ships if game in progress
        while (displayGrid.firstChild) {
            displayGrid.removeChild(displayGrid.lastChild);
        }
        //play single player - multiplayer does not support saving state
        playGameSingle()
    }

    //Remove focus from clicked button css
    document.addEventListener('click', function(e) { if(document.activeElement.toString() == '[object HTMLButtonElement]'){ document.activeElement.blur(); } })
    //grid template rows and columns should be repeating - 10*4.6vm=46vmin. 46vmin+margin of 2 gives 100% of screen size
    if (gameMode == "singlePlayer") {
        createBoard(userGrid,userSquares,width)
        createBoard(opponentGrid,opponentSquares,width)
        grid.css({"grid-template-columns": `repeat(${width}, 4.6vmin`});
        grid.css({"grid-template-rows": `repeat(${width}, 4.6vmin)`});
        generateShipDragBehaviour()
        //Obtain game state from session variable
        $.ajax(
            {
                type: "POST",
                dataType: "json",
                data: "target="+JSON.stringify({target: shotFired}),
                cache:false,
                url:"../php/retrieveGameState.php",
                success: (jsonObj) => resumeState(jsonObj)
            });
            //Start game based on single/multiplayer page
        startSinglePlayer()
    }    
    else startMultiPlayer()
    
    //Multiplayer function - get client's player index
    function playerIndex(socket, index){
        if (index == -1) {
            infoDisplay.html("Sorry, the server is full")
            return
        }
        playerNum = parseInt(index)
        //Player 1 is going to be enemy
        if (playerNum === 1) {
            currentPlayer = "enemy"
            turnDisplay.html("Opponent's turn")
        }
        //Check to see if other player(s) are connected and their status
        let data = {checkPlayers: true}
        socket.send(JSON.stringify(data))
    }
    //A player has connected or disconnected
    function playerConnection(index){
        console.log("Player "+ parseInt(index) + " has connected or disconnected")
        playerConnectedOrDisconnected(index)
    }

    function playerConnectedOrDisconnected(index){
        //player 0 is 1, player 1 is 2
        console.log("Swapping setting for " + (index+1))
        let player = `.p${parseInt(index) +1}`
        //template selector to get div of class p1 or p2 and the .connected div within it, and toggle active
        document.querySelector(`${player} .connected`).classList.toggle("active")
        //Can't be ready if not connected
        if (!document.querySelector(`${player} .connected`).classList.contains("active") && document.querySelector(`${player} .ready`).classList.contains("active")) {
            document.querySelector(`${player} .ready`).classList.remove("active")
        }
        //If the player that just connected is this client, make player indicator bigger
        if (parseInt(index) == playerNum) document.querySelector(player).style.fontSize = "1.8rem"
        else document.querySelector(player).style.fontSize = "1.6rem"
    }

    function processEnemyReady(socket, indexOfReadyPlayer){
        enemyReady = true;
        playerReady(indexOfReadyPlayer)
        if (ready) playGameMulti(socket)
    }

    function processOtherPlayers(otherPlayerExists, otherPlayerReady, otherPlayerIndex){
        if (!otherPlayerExists) return
        playerConnectedOrDisconnected(otherPlayerIndex)
        if (otherPlayerReady) {
            playerReady(otherPlayerIndex)
            enemyReady = true;
        }
    }
    //Attack has been received
    function processAttack(socket, indexOfTargetedSquare){
        //Pull opponentGo function into here for multiplayer client-side resolution
        opponentGo(indexOfTargetedSquare)
        const square = userSquares[indexOfTargetedSquare]
        let message = {fireReply: square.classList}
        //Send data about the targeted square to the server
        socket.send(JSON.stringify(message))
        playGameMulti(socket)
    }
    function shotReport(socket, shotReport){
        revealSquare(shotReport)
        playGameMulti(socket)
    }

    function generateMultiplayerBoards(widthObtained, socket){
        //Create boards for user and opponent
        width = widthObtained
        console.log(width)
        createBoard(userGrid,userSquares,width)
        createBoard(opponentGrid,opponentSquares,width)
        grid.css({"grid-template-columns": `repeat(${width}, 4.6vmin`});
        grid.css({"grid-template-rows": `repeat(${width}, 4.6vmin)`});
        generateShipDragBehaviour(width)
        opponentSquares.forEach(square => {
            square.addEventListener("click", ()=>{
                if (currentPlayer == "user" && ready && enemyReady) {
                    console.log("here")
                    shotFired = square.dataset.id
                    let data = {shotFired: shotFired}
                    //each time a squar is clicked, send its id to the server
                    socket.send(JSON.stringify(data))
                }
            });
        });
    }

    //Multi Player
    function startMultiPlayer(){
        //Socket logic - making a connection to PHP web socket server from JS client in browser
        //only want socket logic in multiplayer mode
        var socket = new WebSocket('ws://localhost:8080');
        // Open the socket
        socket.onopen = function(e) {
            // Send an initial message
            console.log('Connecting to server...');
            socket.send("I am the client and I have opened a socket connection");
        };

        // Listen for messages
        socket.onmessage = function(event) {
            var jsonResponse = true;
            var message;
            console.log("Received " +event.data)
            try {
                message = $.parseJSON(event.data);
            } catch (error) {
                jsonResponse = false;
            }        
            //Call appropriate function based on keys in returned JSON from php socket if message is json
            switch (jsonResponse && message != null) {
                //Server has assigned an index to the client
                case message.playerIndex != null:
                    console.log('< Player index: ' + message.playerIndex);
                    playerIndex(this, message.playerIndex);
                    break;
                //Server has received another connection and is telling client
                case message.playerConnection != null:
                    playerConnection(message.playerConnection);
                    break;
                case message.width != null: generateMultiplayerBoards(message.width, socket);break;
                //The server is telling the cient that the opponent client has readied up 
                case message.enemyReady == true: processEnemyReady(this, message.indexOfReadyPlayer);break;
                //The server is telling the client info regarding other connections that may already exist 
                case message.otherPlayerExists != null: processOtherPlayers(message.otherPlayerExists, message.otherPlayerReady, message.otherPlayerIndex);break;
                //The server is telling the client that they have been attacked
                case message.attack != null: processAttack(this, message.attack); break;
                //The client has attacked - server is returning the classList of the opponent's attacked square
                //Used to determine if it's a successful hit
                case message.shotReport != null: shotReport(this, message.shotReport)
                default: break;
            }
        };
        // Listen for socket closes
        socket.onclose = function(event) {
            console.log('Client notified socket has closed', event);
            socket.close()
        };
        
        //Ready button click
        startButton.on("click", ()=>{
            if (allShipsPlaced) playGameMulti(socket)
            else infoDisplay.html("Please place all your ships!")
        });
    }

    //Single Player
    function startSinglePlayer(){
        console.log("Start single ")
        //only generate computer ships in single player mode
        //AJAX generate board
        //Create boards for user and opponent
        $.ajax(
            {
                cache:false,
                url:"../php/initBoard.php",
                success: function(jsonObj){
                    console.log(jsonObj);
                }
            });
        startButton.on("click", () => {
            if (allShipsPlaced) playGameSingle()
            else infoDisplay.html("Please place all your ships!")
        })
    }
    //squares array of div with id 0->(width**2)-1
    //HTML Grid to contain them all
    function createBoard(grid, squares, width){
        for (let index = 0; index < width ** 2; index++) {
            const square = document.createElement('div')
            //give unique id to square on grid
            square.dataset.id = index
            grid.append(square)
            squares.push(square)
        }
    }

    //Call rotate function when rotate button is clicked
    $('#rotate').click(rotate);

    function rotate(){
        //toggle orientation of ships' CSS classes
        doubleToggle(destroyer,'destroyer-container-vertical', 'destroyer-container')
        doubleToggle(submarine,'submarine-container-vertical', 'submarine-container')
        doubleToggle(cruiser,'cruiser-container-vertical', 'cruiser-container')
        doubleToggle(battleship,'battleship-container-vertical', 'battleship-container')
        doubleToggle(carrier,'carrier-container-vertical', 'carrier-container')
        isHorizontal = !isHorizontal;
    }
    function doubleToggle(element, class0, class1) {
        element.classList.toggle(class0);
        element.classList.toggle(class1);
      }

      function generateShipDragBehaviour(){
        //ship drag and drop handler
        //Add event listeners to ships
        ships.on('dragstart', dragStart)
        //The following event listeners allow squares in the user grid to accept ships
        userSquares.forEach(square => square.addEventListener('dragStart',dragStart))
        userSquares.forEach(square => square.addEventListener('dragover',dragOver))
        userSquares.forEach(square => square.addEventListener('dragenter',dragEnter))
        userSquares.forEach(square => square.addEventListener('dragleave',dragLeave))
        userSquares.forEach(square => square.addEventListener('drop',dragDrop))

        ships.on('mousedown', function(e){
            //When beginning a drag of any ship, get the ID of the square that the mouse was hovering over. For submarine, this will return submarine-0, submarine-1 or submarine-2
            selectedShipAndIndex = e.target.id
        })
      }

      function dragStart(){
          draggedShip = this
          draggedShipLength = this.children.length
      }
      function dragOver(e){
        e.preventDefault()
      }
      function dragEnter(e){
        e.preventDefault()
      }
      function dragLeave(e){
        e.preventDefault()
      }
      function dragDrop(){
        //ship name and last square. E.g. destroyer-1
        let draggedShipNameAndFinalIndex = draggedShip.lastElementChild.id
        //ship type. E.g. destroyer
        let draggedShipNameClass = draggedShipNameAndFinalIndex.slice(0,-2)
        //e.g. 1
        let draggedShipFinalIndex = parseInt(draggedShipNameAndFinalIndex.substr(-1))
        //Square receiving mouse drop of battleship
        let squareReceivingDrop = parseInt(this.dataset.id)
        //for calculating ships, use 1 for horizontal or the board width for vertical calculations
        horizontalOffset = isHorizontal ? 1 : width
        console.log(width)
        //This string will be used to round the edge of the ship being placed on the grid in the correct areas
        let orientationClass = isHorizontal ? "horizontal" : "vertical"
        //final index (rightmost or bottom) of dragged ship upon being placed on board
        let shipLastId = (draggedShipFinalIndex * horizontalOffset) + squareReceivingDrop
        //ship first index - shipLastId - ship size * horizontalOffset
        let shipFirstId = shipLastId - draggedShipFinalIndex * horizontalOffset
        //Create an array of squares in which the rightmost index of a ship cannot be dropped
        const notAllowedHorizontal = generateForbiddenHorizontalSquares(draggedShipFinalIndex)
        //Create an array of squares in which the topmost index of a ship cannot be dropped
        const notAllowedVertical = generateForbiddenVerticalSquares(draggedShipFinalIndex)
        //Ship being dragged - what is the index of the square being picked up? Destroyer will return 0 or 1, depending on which square is being dragged
        selectedShipIndex = parseInt(selectedShipAndIndex.substr(-1)) * horizontalOffset
        //Adjust shipLastId so that it returns the number of remaining squares to the bottom/right of the current square being dragged 
        shipLastId -= selectedShipIndex
        //first ID is only being used to check vertical ships, so we only care about this when it's multiplied by width
        shipFirstId -= selectedShipIndex
        //all squares the ship would occupy
        //Draw ship on grid
        //if we're placing it horizontally and the LAST occupied square of the ship isn't in the forbidden tiles
        //If we're placing vertically then this should check that the FIRST square the ship occupies is not in the forbidden zone
        if ((isHorizontal && !notAllowedHorizontal.includes(shipLastId)) || (!isHorizontal && !notAllowedVertical.includes(shipFirstId))) {
            //array of integers between ship first ID and ship Last ID with a separator of 1 or width - none of the tickets being hovered over contains 'taken'
            let squaresToPaint = new Map()
            for (let i = 0; i < draggedShipLength; i++) {
                let shipStartEndClass = "middle"+i
                if (i === 0) shipStartEndClass = "start"
                if (i === draggedShipLength - 1) shipStartEndClass = "end"
                squareIndex = squareReceivingDrop - selectedShipIndex + (i * horizontalOffset)
                if (userSquares[squareIndex].classList.contains("taken")) return//if any of the squares are already taken, don't paint the ship
                squaresToPaint.set(shipStartEndClass,squareIndex)
             }
            squaresToPaint.forEach((squareIndex, shipStartEndClass) => {
                userSquares[squareIndex].classList.add('taken',draggedShipNameClass, orientationClass, shipStartEndClass)
                //ships should not be able to be re-dragged on hard click from inside userGrid
                userGrid.find(`[data-id="${squareIndex}"]`).mousedown(function(){return false})
            })
            displayGrid.removeChild(draggedShip)
            //If no child ships remain in displayGrid then all ships have been placed
            if (!displayGrid.querySelector(".ship")) allShipsPlaced = true;
        }
      }
      function generateForbiddenHorizontalSquares(draggedShipFinalIndex){
          let squares = []
          //We know userSquares will be a square number since it's typically 10*10 or 7*7 etc.
          for (let index = 0; index < width; index++) {
              for (let iterator = 0; iterator < draggedShipFinalIndex; iterator++) {
                  forbiddenSquare = (index * width) + iterator
                  squares.push(forbiddenSquare)
              }
          }
          return squares
      }
      function generateForbiddenVerticalSquares(draggedShipFinalIndex){
          let squares = []
          //Similar logic that was used for generating horizontal squares
          for (let index = 0; index < draggedShipFinalIndex; index++) {
              for (let iterator = 0; iterator < width; iterator++) {
                  //-1 to offset the fact that userSquares.length is 1 greater than the index of the final element in userSquares. Square with id 100 does not exist in a 10x10 grid as it's 0 based
                forbiddenSquare = userSquares.length -1 -(index * width) - iterator
                squares.push(forbiddenSquare)
              }
          }
          return squares
      }
      //Multi Player game logic
      function playGameMulti(socket) {
          if (isGameOver) return
          buttons.css({"display":"none"})
          if (!ready) {
              var msg = new Object();
              //Tell server that player is ready and ready up player
              msg.playerReady = true;
              socket.send(JSON.stringify(msg))
              ready = true
              playerReady(playerNum)
          }
          if (enemyReady) {
              if (currentPlayer == "user") {
                  turnDisplay.html("Your turn")
              }
              if (currentPlayer == "enemy") {
                turnDisplay.html("Enemy's turn")
              }
          }
      }
      function playerReady(num) {
          let player = `.p${parseInt(num)+1}`
          document.querySelector(`${player} .ready`).classList.toggle("active")
      }
      function shootEnemy(shotFired){
        $.ajax(
            {
                type: "POST",
                dataType: "json",
                data: "target="+JSON.stringify({target: shotFired}),
                cache:false,
                url:"../php/attack.php",
                success: function(jsonObj) {
                    revealSquare(jsonObj)
                } 
            });
      }
      //Single Player game logic
      function playGameSingle() {
          console.log("heya")
          if (isGameOver) return
          buttons.css({"display":"none"})
          let userState = []
          //update server with status of user board
          userSquares.forEach(square=>userState.push(square.classList));
          $.ajax(
            {
                type: "POST",
                dataType: "json",
                data: "board="+JSON.stringify(userState),
                cache:false,
                url:"../php/updateUserBoard.php"
            });
          if (currentPlayer === 'user'){
              //Add click handler to opponent's board
            $(".grid-computer div").each(function(){
                if ($(this).attr("class") === undefined) {
                    $(this).on("click",function(){
                    shotFired = this.dataset.id
                    console.log("shot fired "+shotFired)
                    shootEnemy(shotFired)
                    //Remove click handler if square already clicked
                    $(this).off()
                    })
                }
                else $(this).off()
                
            })
            }
          if (currentPlayer === 'enemy'){
            setTimeout(opponentGo, 1000)
        }
      }

      function revealSquare(classList) {
          //The square that the client just shot
          const opponentSquare = opponentGrid.querySelector(`div[data-id="${shotFired}"]`)
          const square = Object.values(classList)
          //don't carry out a turn if the square has already been guessed, if its not the user's turn, or if the game is over
          //if it's already been hit/missed in single player, message will not be null. 
          if ((opponentSquare.classList.contains('hit') || opponentSquare.classList.contains('miss')) || currentPlayer != "user" || isGameOver) return
          if (square.includes('destroyer')) destroyerCount++
          if (square.includes('cruiser')) cruiserCount++
          if (square.includes('submarine')) submarineCount++
          if (square.includes('battleship')) battleshipCount++
          if (square.includes('carrier')) carrierCount++
          if (square.includes('taken')) {
            opponentSquare.classList.add('hit')
          } else {
            opponentSquare.classList.add('miss')
          }
          turnDisplay.html('Enemy turn')
          checkForWins()
          currentPlayer = 'enemy'
          if (gameMode == "singlePlayer") playGameSingle()
      }
      function opponentGo(squareToAttack){
          //Param is undefined for single player version - only provided if sent by opponent
          squareToAttack = (gameMode == "singlePlayer") ? userSquares[Math.floor(Math.random() * userSquares.length)] : userSquares[squareToAttack]
          //run function again if square has already been tried
          if (squareToAttack.classList.contains('hit') || squareToAttack.classList.contains('miss')){
            opponentGo()
          }
          else {
            if (squareToAttack.classList.contains('destroyer')) opponentDestroyerCount++
            if (squareToAttack.classList.contains('cruiser')) opponentCruiserCount++
            if (squareToAttack.classList.contains('submarine')) opponentSubmarineCount++
            if (squareToAttack.classList.contains('battleship')) opponentBattleshipCount++
            if (squareToAttack.classList.contains('carrier')) opponentCarrierCount++
            checkForWins()
            if (squareToAttack.classList.contains('taken')) {
                squareToAttack.classList.add('hit')
            } else {
                squareToAttack.classList.add('miss')
            }
            turnDisplay.html('Your turn')
            currentPlayer = 'user'
            if (gameMode == "singlePlayer") playGameSingle()
        }
    }

      //Function to see if the user has won
      function checkForWins(){
          console.log(carrierCount)
          console.log(battleshipCount)
          console.log(opponentCarrierCount)
          console.log(opponentBattleshipCount)
          if (destroyerCount === 2) {
              infoDisplay.html("You have sunk the opponent's destroyer")
              destroyerCount = 10
          }
          if (submarineCount === 3) {
              infoDisplay.html("You have sunk the opponent's submarine")
              submarineCount = 10
          }
          if (cruiserCount === 3) {
              infoDisplay.html("You have sunk the opponent's cruiser")
              cruiserCount = 10
          }
          if (battleshipCount === 4) {
              infoDisplay.html("You have sunk the opponent's battleship")
              battleshipCount = 10
          }
          if (carrierCount === 5) {
              infoDisplay.html("You have sunk the opponent's carrier")
              carrierCount = 10
          }
          if (opponentDestroyerCount === 2) {
              infoDisplay.html("The opponent has sunk your destroyer")
              opponentDestroyerCount = 10
          }
          if (opponentSubmarineCount === 3) {
              infoDisplay.html("The opponent has sunk your submarine")
              opponentSubmarineCount = 10
          }
          if (opponentCruiserCount === 3) {
              infoDisplay.html("The opponent has sunk your cruiser")
              opponentCruiserCount = 10
          }
          if (opponentBattleshipCount === 4) {
              infoDisplay.html("The opponent has sunk your battleship")
              opponentBattleshipCount = 10
          }
          if (opponentCarrierCount === 5) {
              infoDisplay.html("The opponent has sunk your carrier")
              opponentCarrierCount = 10
          }
          if (destroyerCount + cruiserCount + submarineCount + battleshipCount + carrierCount === 50) {
              infoDisplay.html("You win!")
              gameOver()
          }
          if (opponentDestroyerCount + opponentCruiserCount + opponentSubmarineCount + opponentBattleshipCount + opponentCarrierCount === 50) {
              infoDisplay.html("You lose!")
              gameOver()
          }
      }
      function gameOver() {
        isGameOver = true
        //
        if (gameMode == "multiPlayer") {
            document.querySelector(`.ready`).classList.remove("active")
        }
        //unset session vars
        $.get("../php/gameOver.php", function(){
            setTimeout(6000,function(){
                location.reload();
            });
      });
    }
});