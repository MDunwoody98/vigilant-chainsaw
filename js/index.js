$(function() {
    const userGrid = $('.grid-user')
    const computerGrid = $('.grid-computer')
    const displayGrid = $('.grid-display')
    const ships = $('.ship')
    const destroyer = $('.destroyer-container')
    const submarine = $('.submarine-container')
    const cruiser = $('.cruiser-container')
    const battleship = $('.battleship-container')
    const carrier = $('.carrier-container')
    const startButton = $('#start')
    const rotateButton = $('#rotate')
    const turnDisplay = $('#turn')
    const infoDisplay = $('#info')

    const userSquares = []
    const computerSquares = []
    const width = 10;

    function createBoard(grid, squares, width){
        for (let index = 0; index < width ** 2; index++) {
            const square = document.createElement('div')
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
        let direction = randomDirection == 0 ? 1 : 10
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
        //****MAYBE MAKE AN EXCEPTION IF THE INDEX IS THE LAST INDEX OF THE SHIP*****
        const isAtRightEdge = chosenOrientation.some(index => (randomStartPosition + index) % width === width -1)
        //Check if ship will be on left edge if any of its squares' (indices % width) equal 0
        //****MAYBE MAKE AN EXCEPTION IF THE INDEX IS THE FIRST INDEX OF THE SHIP
        const isAtLeftEdge = chosenOrientation.some(index => (randomStartPosition + index) % width === 0)
        //If all these are good, ship is painted onto the board. Otherwise, run function again to try a different position
        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) chosenOrientation.forEach(index => computerSquares[randomStartPosition + index].classList.add('taken', ship.name))
        else generate(ship, width)
    }
    shipArray.forEach(ship => generate(ship,width))
});