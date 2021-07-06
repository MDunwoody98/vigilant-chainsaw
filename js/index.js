$(function() {
    const userGrid = $('.grid-user')
    const computerGrid = $('.grid-computer')
    const displayGrid = $('.grid-display')
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

    const userSquares = []
    const computerSquares = []
    const width = 10;

    let isHorizontal = true;

    function createBoard(grid, squares, width){
        for (let index = 0; index < width ** 2; index++) {
            const square = document.createElement('div')
            //give unique id to square on grid
            square.dataset.id = index
            grid.append(square)
            squares.push(square)
        }
    }
    createBoard(userGrid,userSquares,width)
    createBoard(computerGrid,computerSquares,width)

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
        //Math.abs forces this number to be positive in case it tries to place on a negative square
        let randomStartPosition = Math.floor(Math.random() * (computerSquares.length - (ship.directions[0].length * direction)))
        //Make sure square is not already taken by other ship
        //for each square that would be consumed by the current ship at its chosen orientation,
        //check the grid for the AI's ship positions, starting at randomStartPosition.
        //If any of the squares contains a class of "taken" then a different random start position must be used
        const isTaken = chosenOrientation.some(index =>computerSquares[randomStartPosition + index].classList.contains("taken"))
        //assume width is 10 for a 10x10 grid. Check the start position - should be from 1-100
        //Check each square that the ship will occupy. If that square's index % width is equal to width-1, it is on the right edge
        //Exception if the index is the final one of the ship, as that is fine to be in the rightmost column
        const isAtRightEdge = chosenOrientation.slice(0,-1).some(index => (randomStartPosition + index) % width === width -1)
        //Check if ship will be on left edge if any of its squares' (indices % width) equal 0
        //Exception if the index is the first one of the ship, as that is fine to be in the leftmost column
        const isAtLeftEdge = chosenOrientation.slice(1).some(index => (randomStartPosition + index) % width === 0)
        //If all these are good, ship is painted onto the board. Otherwise, run function again to try a different position
        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) chosenOrientation.forEach(index => computerSquares[randomStartPosition + index].classList.add('taken', ship.name))
        else generate(ship, width)
    }
    shipArray.forEach(ship => generate(ship,width))

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
        //final index (rightmost or bottom) of dragged ship upon being placed on board
        let shipLastId = (draggedShipFinalIndex * horizontalOffset) + squareReceivingDrop
        //ship first index - shipLastId - ship size * horizontalOffset
        let shipFirstId = shipLastId - draggedShipFinalIndex * horizontalOffset
        //Create an array of squares in which the rightmost index of a ship cannot be dropped
        const notAllowedHorizontal = generateForbiddenHorizontalSquares(draggedShipFinalIndex)
        //Create an array of squares in which the topmost index of a ship cannot be dropped
        const notAllowedVertical = generateForbiddenVerticalSquares(draggedShipFinalIndex)
        console.log(notAllowedVertical)

        //Ship being dragged - what is the index of the square being picked up? Destroyer will return 0 or 1, depending on which square is being dragged
        selectedShipIndex = parseInt(selectedShipAndIndex.substr(-1)) * horizontalOffset
        //Adjust shipLastId so that it returns the number of remaining squares to the bottom/right of the current square being dragged 
        shipLastId -= selectedShipIndex
        //first ID is only being used to check vertical ships, so we only care about this when it's multiplied by width
        shipFirstId -= selectedShipIndex
        console.log(shipFirstId)
        console.log(squareReceivingDrop)
        console.log(shipLastId)
        //Draw ship on grid
        
        //if we're placing it horizontally and the LAST occupied square of the ship isn't in the forbidden tiles
        //If we're placing vertically then this should check that the FIRST square the ship occupies is not in the forbidden zone
        if ((isHorizontal && !notAllowedHorizontal.includes(shipLastId)) || (!isHorizontal && !notAllowedVertical.includes(shipFirstId))) {
            for (let i = 0; i < draggedShipLength; i++) {
            userSquares[squareReceivingDrop - selectedShipIndex + (i * horizontalOffset)].classList.add(draggedShipNameClass,'taken')
             }
        }
        
        displayGrid.removeChild(draggedShip)

      }
      function dragEnd(){

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
});