'use strict'

console.log('Mine Sweepaaa 2.0');

const MINE = '💣';
const FLAG = '🚩';
const WIN = '😎';
const DEAD = '😵';
const SMILE = '🙂';
const LIFE_SIGN = '💔';

var gElSmileyBtn = document.querySelector('.button-smiley');
var gElScore = document.querySelector('.score');
var gElClock = document.querySelector('.clock');
var gElLives = document.querySelector('.lives');
var gElHints = document.querySelector('.button-hintButton');

var gMines = [];
var gLives = [];
var gHint = 3;
var gCellsAtHintModeCoords = [];
var gScore = 0;
var gGameTime = null;
var gFirstCellClicked = false; // essential for placing mines only after first click, and also for avoiding flag placing before the mines are placed

var gBoard = [];
var gLevel = {
    size: 8,
    mines: 12,

}

var gGame = {
    isOn: false,
    isHintModeOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    startTime: null,
    endTime: null
}

function init() {
    gGame = {
        isOn: false,
        isHintModeOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        startTime: null,
        endTime: null
    }
    gFirstCellClicked = false;
    clearInterval(gGameTime);
    gGameTime = null;
    gElClock.innerText = '00:00';
    gElSmileyBtn.innerText = SMILE;
    gLives = [LIFE_SIGN, LIFE_SIGN, LIFE_SIGN];
    gElLives.innerText = gLives;
    gHint = 3;
    gElHints.innerText = 'Hints: ' + gHint;
    gScore = 0;
    gElScore.innerText = 'Score: ' + gScore;
    gBoard = [];
    gMines = [];
    gElHints.classList.remove('hintModeOn');
    gCellsAtHintModeCoords = [];
    buildBoard(gLevel.size);
    renderBoard();
}


function buildBoard(size) {
    for (var i = 0; i < size; i++) {
        gBoard[i] = [];
        for (var j = 0; j < size; j++) {
            gBoard[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
}

function renderBoard() {
    var strHtml = ''
    for (var i = 0; i < gBoard.length; i++) {
        strHtml += '<tr>';
        for (var j = 0; j < gBoard[i].length; j++) {
            strHtml += `<td class="cell cell-${i}-${j}" onclick="cellClicked(this)" oncontextmenu="cellRightClicked(this)" data-i="${i}" data-j="${j}"></td>`
        }
        strHtml += '</tr>'
    }
    var elTableBody = document.querySelector('tbody');
    elTableBody.innerHTML = strHtml;
}

function setWarZone(gameLevel, firstI, firstJ) {
    gGame.isOn = true;
    gGame.startTime = new Date().getTime();
    gGameTime = setInterval(runClock, 100);
    var cnt = 0
    while (cnt < gameLevel) {
        var randRow = getRandomIntInclusive(0, gBoard.length - 1);
        var randCol = getRandomIntInclusive(0, gBoard[0].length - 1);
        while (randRow === firstI && randCol === firstJ) {  // Making sure that first cell clicked doesn't get 'isMine'
            randRow = getRandomIntInclusive(0, gBoard.length - 1);
            randCol = getRandomIntInclusive(0, gBoard[0].length - 1);
        }
        for (var i = 0; i < gBoard.length; i++) {
            if (i === randRow) {
                for (var j = 0; j < gBoard[i].length; j++) {
                    if (j === randCol && !gBoard[i][j].isMine) {
                        gBoard[i][j].isMine = true;
                        gMines.push({ I: i, J: j })
                        cnt++;
                        break;
                    }
                }
            }
        }
    }
    console.log('Mines positions:', gMines);
    setMinesNegsCount(gBoard);
    showConsole(gBoard);
}

function cellClicked(elCell) {

    var cellIdxI = +elCell.getAttribute('data-i');
    var cellIdxJ = +elCell.getAttribute('data-j');

    if (!gFirstCellClicked) {
        setWarZone(gLevel.mines, cellIdxI, cellIdxJ);
        gFirstCellClicked = true;
    }
    if (gGame.isOn && !gGame.isHintModeOn && !gBoard[cellIdxI][cellIdxJ].isMarked) {
        expandShown(cellIdxI, cellIdxJ); // Before revealing the cell - first we check for expanding the shown area
    }
    if (gGame.isOn && gGame.isHintModeOn && gFirstCellClicked) {
        clickCellHint(elCell);
        setTimeout(unrevealHintArea, 1000);
    }

}

function cellRightClicked(elCell) {

    var cellIdxI = +elCell.getAttribute('data-i');
    var cellIdxJ = +elCell.getAttribute('data-j');

    if (gFirstCellClicked && gGame.isOn) {

        if (gBoard[cellIdxI][cellIdxJ].isShown) { return; }

        if (!gBoard[cellIdxI][cellIdxJ].isMarked) {
            gBoard[cellIdxI][cellIdxJ].isMarked = true;
            elCell.innerHTML = FLAG;
            gGame.markedCount++;
            checkVictory();

        } else {
            gBoard[cellIdxI][cellIdxJ].isMarked = false;
            elCell.innerHTML = '';
            gGame.markedCount--;
        }

    } else return;
}

function revealCell(cellIdxI, cellIdxJ) {
    var elCell = document.querySelector(`.cell-${cellIdxI}-${cellIdxJ}`)
    if (!gBoard[cellIdxI][cellIdxJ].isMine) {
        if (gBoard[cellIdxI][cellIdxJ].isShown) { return; }
        if (gBoard[cellIdxI][cellIdxJ].isMarked) { return; }
        if (gBoard[cellIdxI][cellIdxJ].minesAroundCount !== 0 && !gBoard[cellIdxI][cellIdxJ].isMine) {
            elCell.innerText = gBoard[cellIdxI][cellIdxJ].minesAroundCount;
        }
        gGame.shownCount++;
        gBoard[cellIdxI][cellIdxJ].isShown = true;
        elCell.classList.add('isShown');
        checkVictory();

    } else if (gBoard[cellIdxI][cellIdxJ].isMine) {
        hitMine(elCell);
        
    }
}

function expandShown(cellIdxI, cellIdxJ) {
    var currCell = gBoard[cellIdxI][cellIdxJ];
    if (currCell.minesAroundCount === 0 && !currCell.isShown) { // First and second condition for expanding the shown area
        revealCell(cellIdxI, cellIdxJ);
        if (!currCell.isMine) {                                 // <--- and the third condition. Once we pass this we check for starting a recursion
            var currNegsArr = getNegsCoords(cellIdxI, cellIdxJ); // Gathering the coords of all negs cells. the getNegsCoords func retrieves an array
            for (var i = 0; i < currNegsArr.length; i++) {
                expandShown(currNegsArr[i][0], currNegsArr[i][1]); // --> Recursion <--
            }
        }
    } else {
        revealCell(cellIdxI, cellIdxJ); // In case one of the first two conditions doesn't stand
    }
}

function hitMine(elCell) {
    console.log('mineHit');
    gLives.pop();
    gElLives.innerText = gLives;
    elCell.classList.add('hitMine');
    setTimeout(function () {
        elCell.classList.remove('hitMine')
    }, 500);

    checkGameOver();
}

function checkGameOver() {
    if (!gLives.length) { gameOver(gBoard); }
}

function checkVictory() { // called whenever a cell is revealed, and every time a flag is placed

    if (gLevel.size ** 2 - gLevel.mines === gGame.shownCount && gLevel.mines === gGame.markedCount) {
        gElSmileyBtn.innerText = WIN;
        gGame.isOn = false;
        gGame.endTime = new Date().getTime();
        gGame.secsPassed = Math.round((gGame.endTime - gGame.startTime) / 1000)
        console.log('Winner!');
        console.log('it took you', gGame.secsPassed, 'seconds');
        clearInterval(gGameTime);
        getScore(gGame.secsPassed, gLevel.size, gLives.length);
    } else return
}

function gameOver(board) {
    gGame.isOn = false;
    gElSmileyBtn.innerText = DEAD;
    gElLives.innerText = 'LOSER!';
    clearInterval(gGameTime);
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            if (board[i][j].isMine) {
                var elCell = document.querySelector(`.cell-${i}-${j}`)
                elCell.innerText = MINE;
                elCell.classList.add('isShownMine');
            }
        }
    }
}















































