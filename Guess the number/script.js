let randomNumber = parseInt(Math.random() * 100 + 1);
const submit = document.querySelector('#subt');
const userInput = document.querySelector('#guessField');
const guessSlot = document.querySelector('.guesses');
const remaining = document.querySelector('.lastResult');
const lowOrHi = document.querySelector('.lowOrHi');
const startOver = document.querySelector('.resultParas');

let prevGuess = [];
let numGuess = 1;
let playGame = true;

// ensure we ignore clicks after game ended
submit.addEventListener('click', function (e) {
  e.preventDefault();
  if (!playGame) return;                 // stop if game ended
  const guess = parseInt(userInput.value);
  console.log('guess:', guess);
  validateGuess(guess);
});

function validateGuess(guess) {
  if (isNaN(guess)) {
    alert('Please enter a valid number');
  } else if (guess < 1) {
    alert('Please enter a number greater than 1');
  } else if (guess > 100) {
    alert('Please enter a number smaller than 100');
  } else {
    prevGuess.push(guess);

    // If this is the 11th attempt (i.e. already used 10 attempts), game over
    if (numGuess === 11) {
      displayGuess(guess);
      displayMessage(`Game Over. Random number was ${randomNumber}`);
      endGame();
    } else {
      displayGuess(guess);
      checkGuess(guess);
    }
  }
}

function checkGuess(guess) {
  if (guess === randomNumber) {
    displayMessage('You guessed it right!');
    endGame();
  } else if (guess < randomNumber) {
    displayMessage('Number is TOO low');
  } else {
    displayMessage('Number is TOO high');
  }
}

function displayGuess(guess) {
  userInput.value = '';
  // append guess to the guesses box
  guessSlot.innerHTML += `${guess}, `;
  numGuess++;
  // remaining attempts: after increment, 11 - numGuess gives correct remaining count
  remaining.innerHTML = `${11 - numGuess}`;
}

function displayMessage(message) {
  lowOrHi.innerHTML = `<h2>${message}</h2>`;
}

function endGame() {
  userInput.value = '';
  userInput.setAttribute('disabled', '');
  playGame = false;

  // create a restart button (or reuse if exists)
  let newBtn = document.querySelector('#newGame');
  if (!newBtn) {
    newBtn = document.createElement('button');
    newBtn.id = 'newGame';
    newBtn.textContent = 'Start New Game';
    newBtn.style.marginTop = '20px';
    startOver.appendChild(newBtn);
  }
  newBtn.addEventListener('click', newGame);
}

function newGame() {
  // reset state
  randomNumber = parseInt(Math.random() * 100 + 1);
  prevGuess = [];
  numGuess = 1;
  playGame = true;

  // reset UI
  guessSlot.innerHTML = '';
  remaining.innerHTML = `10`;
  lowOrHi.innerHTML = '';
  userInput.removeAttribute('disabled');

  // remove restart button
  const newBtn = document.querySelector('#newGame');
  if (newBtn) startOver.removeChild(newBtn);
}
