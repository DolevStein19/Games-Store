// adding prodcuts to the cart function // 

let cartGameList = [];

async function addToCart(game) {
    const { gameName, price } = game; 
    const temp = { gameName, price }; 
    cartGameList.push(temp);
    document.getElementById('cart').innerText = `Cart: (${cartGameList.length})`;
    return cartGameList;
};


// when pressing on the cart.html, it takes the list of games and puts it in the cart.html //
async function checkout() {
    try {
            fetch('/addToCart', {
                headers: { "Content-Type": "application/json" },
                method: 'post',
                body: JSON.stringify({cartGameList})
            });

            let res = await fetch('/checkout', {
                headers: { "Content-Type": "application/json" },
                method: 'get',
            });

        let cart = await res.json();
        console.log('cart data:', cart);

        const cartInfoElement = document.getElementById('cartInfo');
        const cartTotalItems = document.getElementById('totalItems');
        const cartTotalPrice = document.getElementById('totalPrice');

        // create html content from the cart data
        const gamesInTheCart = cart.map((item) => {
            return `
                <div id="gameCard">
                    <h2>${item.gameName}</h2>
                    <p>Price:${item.price}$</p>
                </div>
            `;
        });

        // display the games you chose in the cart.html
        const htmlContentGames = `<div>${gamesInTheCart}</div>`;
        cartInfoElement.innerHTML = htmlContentGames;

        // display the amount of items in the cart //
        const htmlContentItems = gamesInTheCart.length;
        cartTotalItems.innerHTML = `total items in the cart: ${htmlContentItems}`;

        //calculate the total price of the cart //
        let total = 0;
        function calculateTotal() {
            cart.forEach(element => {
                total += parseInt(element.price);
            });
        }
        calculateTotal();
        cartTotalPrice.innerHTML = `total price of the cart: ${total}$`;

    } catch (error) {
        console.error('Error fetching cart data:', error);
    }
};


// when pressing buy in the page it sends the data to the db //
async function sendCartToDB(){
    try {
        let res = await fetch('/checkout', {
            headers: { "Content-Type": "application/json" },
            method: 'get',
        });
        
        let cartOrder = await res.json();
        
        const simplifiedCartOrder = cartOrder.map(item => ({
            gameName: item.gameName,
            price: item.price
        }));
        
        await fetch('/buy', {
            headers: { "Content-Type": "application/json" },
            method: 'post',
            body: JSON.stringify({ cartOrder: simplifiedCartOrder })
        });
        if(cartOrder.length != 0){
            console.log('Order successfully sent to db:', simplifiedCartOrder);
            window.location.href = '/';
        }else{
            alert('please add games to your cart')
        }

    } catch (error) {
        console.error('Error sending order to db:', error);
    }
}
checkout();

