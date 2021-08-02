$(function() {
    //Battleship logic
    const userGrid = $('.grid-user')
    const opponentGrid = document.querySelector('.grid-computer')
    const displayGrid = document.querySelector('.grid-display')
    const ships = $('.ship')
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

    const userSquares = []
    const opponentSquares = []
    const width = 10;

    let isHorizontal = true;
    let isGameOver = false

    //Socket Connection variables
    let currentPlayer = 'user'//player 0 will go first
    let playerNum = 0;
    let ready = false;
    let enemyReady = false;
    let allShipsPlaced = false;
    let shotFired = -1;

    //grid of ships and their names and horizontal/vertical sizes
    const shipArray = [
        {
            name: "destroyer",
            directions: [
                [0,1],
                [0,width]
            ]
        },
        {
            name: "cruiser",
            directions: [
                [0,1,2],
                [0,width, width * 2]
            ]
        },
        {
            name: "submarine",
            directions: [
                [0,1,2],
                [0,width, width * 2]
            ]
        },
        {
            name: "battleship",
            directions: [
                [0,1,2,3],
                [0,width, width*2, width*3]
            ]
        },
        {
            name: "carrier",
            directions: [
                [0,1,2,3,4],
                [0,width, width*2, width*3, width*4]
            ]
        }
    ]
    //Remove focus from clicked button css
    document.addEventListener('click', function(e) { if(document.activeElement.toString() == '[object HTMLButtonElement]'){ document.activeElement.blur(); } })
    //grid template rows and columns should be repeating - 10*4.6vm=46vmin. 46vmin+margin of 2 gives 100% of screen size
    grid.css({"grid-template-columns": `repeat(${width}, 4.6vmin`});
    grid.css({"grid-template-rows": `repeat(${width}, 4.6vmin)`});

    //Create boards for user and opponent
    createBoard(userGrid,userSquares,width)
    createBoard(opponentGrid,opponentSquares,width)

    //Start game based on single/multiplayer page
    if (gameMode == "singlePlayer") startSinglePlayer()
    else startMultiPlayer()
    
    //Multiplayer function - get client's player index
    function playerIndex(socket, index){
        if (index == -1) {
            infoDisplay.html("Sorry, the server is full")
            return
        }
        playerNum = parseInt(index)
        //Player 1 is going to be enemy
        if (playerNum === 1) currentPlayer = "enemy"
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
        let player = `.p${parseInt(index) +1}`
        //template selector to get div of class p1 or p2 and the .connected div within it, and the span tag within it
        //Make that span green
        document.querySelector(`${player} .connected span`).classList.toggle("green")
        //If the player that just connected is this client, make player indicator bold
        if (parseInt(index) == playerNum) document.querySelector(player).style.fontWeight = "bold";
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

    //Multi Player
    function startMultiPlayer(){
        //Socket logic - making a connection to PHP web socket server from JS client in browser
        //only want socket logic in multiplayer mode
        var socket = new WebSocket('ws://localhost:8080');
        // Open the socket
        socket.onopen = function(e) {
            var msg = 'I am the client and I have opened a socket connection.';
            console.log('> ' + msg);
            // Send an initial message
            socket.send(msg);
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
        //close socket on refresh
        window.onload = function () {
            socket.close();
         };
        //Ready button click
        startButton.on("click", ()=>{
            if (allShipsPlaced) playGameMulti(socket)
            else infoDisplay.html("Please place all your ships!")
        })
        opponentSquares.forEach(square => {
            square.addEventListener("click", ()=>{
                if (currentPlayer == "user" && ready && enemyReady) {
                    shotFired = square.dataset.id
                    let data = {shotFired: shotFired}
                    //each time a squar is clicked, send its id to the server
                    socket.send(JSON.stringify(data))
                }
            });
        });
    }

    //Single Player
    function startSinglePlayer(){
        //only generate computer ships in single player mode
        shipArray.forEach(ship => generate(ship,width))
        startButton.on("click", () => {
            if (allShipsPlaced) playGameSingle()
            else infoDisplay.html("Please place all your ships!")
        })
    }

    function initBoardAjax(data){
        $.ajax(
            {
                type: "POST",
                dataType: "json",
                data: "gridsize="+data,
                cache:false,
                url:"../php/initBoard.php",
                success: function(jsonObj){
                    console.dir(jsonObj);
                }
            });
    }
    function attackAjax(data){
        $.ajax(
            {
                type: "POST",
                dataType: "json",
                data: "target="+data,
                cache:false,
                url:"../php/initBoard.php",
                success: function(jsonObj){
                    console.dir(jsonObj);
                }
            });
    }

    function createBoard(grid, squares, width){
        for (let index = 0; index < width ** 2; index++) {
            const square = document.createElement('div')
            //give unique id to square on grid
            square.dataset.id = index
            grid.append(square)
            squares.push(square)
        }
    }
    


    function generate(ship, width){
        //0 or 1 - horizontal or vertical
        let randomDirection = Math.floor(Math.random() * ship.directions.length)
        //Orientation will be the values for the specific ship's horizontal or vertical squares 
        let chosenOrientation = ship.directions[randomDirection]
        //If horizontal, set direction to 1. If horizontal set to 10. This value is used to paint the ships on grid
        let direction = randomDirection == 0 ? 1 : width
        //Start position for ship. Random square on grid take away the ship direction's length * direction
        //horizontal - cruiser will have 3 subtracted. For vertical it will have 30 subtracted as it cannot start on cells 71-100
        //This allows the ship to be wholly painted onto the grid from assigning a "safe" start position that won't overflow
        let randomStartPosition = Math.floor(Math.random() * (opponentSquares.length - (ship.directions[0].length * direction)))
        //Make sure square is not already taken by other ship
        //for each square that would be consumed by the current ship at its chosen orientation,
        //check the grid for the AI's ship positions, starting at randomStartPosition.
        //If any of the squares contains a class of "taken" then a different random start position must be used
        const isTaken = chosenOrientation.some(index =>opponentSquares[randomStartPosition + index].classList.contains("taken"))
        //assume width is 10 for a 10x10 grid. Check the start position - should be from 1-100
        //Check each square that the ship will occupy. If that square's index % width is equal to width-1, it is on the right edge
        //Exception if the index is the final one of the ship, as that is fine to be in the rightmost column
        const isAtRightEdge = chosenOrientation.slice(0,-1).some(index => (randomStartPosition + index) % width === width -1)
        //Check if ship will be on left edge if any of its squares' (indices % width) equal 0
        //Exception if the index is the first one of the ship, as that is fine to be in the leftmost column
        const isAtLeftEdge = chosenOrientation.slice(1).some(index => (randomStartPosition + index) % width === 0)
        //If all these are good, ship is painted onto the board. Otherwise, run function again to try a different position
        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) chosenOrientation.forEach(index => opponentSquares[randomStartPosition + index].classList.add('taken', ship.name))
        else generate(ship, width)
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

      //ship drag and drop handler
      //Add event listeners to ships
      ships.on('dragstart', dragStart)
      //The following event listeners allow squares in the user grid to accept ships
      userSquares.forEach(square => square.addEventListener('dragStart',dragStart))
      userSquares.forEach(square => square.addEventListener('dragover',dragOver))
      userSquares.forEach(square => square.addEventListener('dragenter',dragEnter))
      userSquares.forEach(square => square.addEventListener('dragleave',dragLeave))
      userSquares.forEach(square => square.addEventListener('drop',dragDrop))
      userSquares.forEach(square => square.addEventListener('dragEnd',dragEnd))

      //variables to store ship being dragged
      let selectedShipAndIndex
      let draggedShip
      let draggedShipLength

      ships.on('mousedown', function(e){
        //When beginning a drag of any ship, get the ID of the square that the mouse was hovering over. For submarine, this will return submarine-0, submarine-1 or submarine-2
        selectedShipAndIndex = e.target.id
      })

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
            squaresToPaint.forEach((squareIndex, shipStartEndClass) => userSquares[squareIndex].classList.add('taken',draggedShipNameClass, orientationClass, shipStartEndClass))
            displayGrid.removeChild(draggedShip)
            //If no child ships remain in displayGrid then all ships have been placed
            if (!displayGrid.querySelector(".ship")) allShipsPlaced = true;
        }
      }
      function dragEnd(){
          console.log('drag end')
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
          document.querySelector(`${player} .ready span`).classList.toggle("green")
      }
      //Single Player game logic
      function playGameSingle() {
          if (isGameOver) return
          buttons.css({"display":"none"})
          if (currentPlayer === 'user'){
              opponentSquares.forEach(square => square.addEventListener('click', function(e){
                  shotFired = square.dataset.id
                  revealSquare(square.classList)
              }));
          }
          if (currentPlayer === 'enemy'){
            setTimeout(opponentGo, 1000)
        }
      }
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

      function revealSquare(classList) {
          //The square that the client just shot
          const opponentSquare = opponentGrid.querySelector(`div[data-id="${shotFired}"]`)
          const square = Object.values(classList)
          //don't carry out a turn if the square has already been guessed, if its not the user's turn, or if the game is over
          console.log("Classes of targeted square are "+opponentSquare.classList)
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
          if ((squareToAttack.classList.contains('hit') || squareToAttack.classList.contains('miss')) && gameMode == "singlePlayer") opponentGo()
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

      function checkForWins(){
          //may be the wrong way round lol
          console.log("hits on opponent's destroyer: "+opponentDestroyerCount)
          console.log("hits on my carrier: "+ carrierCount)
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
          startButton.off('click', playGameSingle)
      }




      //code shamelessly stolen from class
      var size = 4;
      //buildBoard(size);
      var data = {gridSize: size};
      $(".cell").on("click",function(){
        id = this.id;
        var data = {id: this.id};
        attack(JSON.stringify(data));
      });
      initBoard(JSON.stringify(data));

      function initBoard(data){
          $.ajax(
              {
                  type:"POST",
                  dataType:"json",
                  data:"gridSize="+data,
                  cache:false,
                  url:"../php/initBoard.php",
                  success:function(jsonObj){
                      console.dir(jsonObj);
                  }
              });
      }
      function attack(data){
          $.ajax(
              {
                  type:"POST",
                  dataType:"json",
                  data:"data="+data,
                  cache:false,
                  url:"../php/attack.php",
                  success:function(jsonObj){
                      console.dir(jsonObj);
                  }
              });
      }
});