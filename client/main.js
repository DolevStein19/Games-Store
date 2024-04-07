// verifying if the email and password exist and log the user //
async function verify(){
    let email = document.getElementById('email').value
    let password = document.getElementById('password').value

    let res = await fetch ('/main',{
        headers:{"Content-Type":"application/json"},
        method:'post',
        body: JSON.stringify({
            email, 
            password    
        })
    });
    
    let data = await res.json();
    console.log(data);
}

// bonus part (sort and search)
function sortGames() {
    getGames(); 
}

document.getElementById('searchTerm').addEventListener('input', function() {
    getGames(); // Call getGames() function on every input event
});

// getting the games to the main.html from the db //
async function getGames(){
    let res = await fetch('/getGames', {
        headers: { "Content-Type": "application/json" },
        method: 'get',
    });
    let gameList = await res.json();

    // Sorting logic...
    const sortCriteria = document.getElementById('sortCriteria').value;
    if (sortCriteria === 'name') {
        gameList.sort((a, b) => {
            const nameA = a.gameName.toUpperCase();
            const nameB = b.gameName.toUpperCase();
            if (nameA < nameB) {
                return -1;
            }
            if (nameA > nameB) {
                return 1;
            }
            return 0; 
        });
    } else if (sortCriteria === 'price') {
        gameList.sort((a, b) => a.price - b.price);
    }

    // Filtering logic for search
    const searchTerm = document.getElementById('searchTerm').value.toLowerCase();
    const filteredGames = gameList.filter(game => game.gameName.toLowerCase().includes(searchTerm));

    // Generating HTML for filtered games
    const gameListHTML = filteredGames.map(((game) => {
        return `
            <div id="gameCard">
                <div class="gameImage">
                    <img src="${game.imagePath}" alt="${game.gameName} Image" width="200" height="200">
                </div>
                <div class="gameDetails">
                    <h2>${game.gameName}</h2>
                    <p>Price: ${game.price}$</p>
                    <p>Genre: ${game.genre}</p>
                    <button onclick='addToCart(${JSON.stringify(game)})' type="button" class="btn btn-outline-primary me-2">Add to Cart</button>
                </div>
            </div>
        `;
    }));

    // Rendering filtered games
    const gameInfoElement = document.getElementById('gameInfo');
    const htmlContent = `<div>${gameListHTML.join('')}</div>`;
    gameInfoElement.innerHTML = htmlContent;
}

getGames();
