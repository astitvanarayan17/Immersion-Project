let progress = 0;
let progressBar = document.getElementById('progress-bar');
const addButton = document.getElementById('add-button');

addButton.addEventListener('click', function() {
  if (progress < 100) {
    progress += 10;
    progressBar.style.width = progress + '%';
  } else {
    
    const newProgressBar = document.createElement('div');
    newProgressBar.classList.add('progress-bar');
    newProgressBar.style.width = '0%'; // start at 0%

    
    progress = 0;

    
    const newContainer = document.createElement('div');
    newContainer.classList.add('progress-container');
    newContainer.appendChild(newProgressBar);

    
    document.body.insertBefore(newContainer, addButton);

    progressBar = newProgressBar;
  }
});
