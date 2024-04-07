const express = require('express');
const bp = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();


const PORT = process.env.PORT || 3000;
app.use(bp.urlencoded({extended: false}));
app.use(bp.json());

app.use(express.static('client'))

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));

const con = ()=>{console.log('db connected');}
mongoose.connect('mongodb+srv://dolevstein:3r5iteCvW2J2ijP@cluster0.ccthzva.mongodb.net/SvShop', con());

// users
const userSchema = mongoose.Schema({
    userName: String,
    email: String,
    password: String
});

const userModel = mongoose.model('Users',userSchema);

// games
const gameSchema = mongoose.Schema({
    gameName:String,
    id: Number,
    price: Number,
    genre: String,
    imagePath: String

})
const gameModel = mongoose.model('Games',gameSchema)

// carts 
const cartSchema = mongoose.Schema({
    userName: String,
    gameName: String,
    price: Number,
});

const cartModel = mongoose.model('Carts',cartSchema)

//Cart orders
const cartordersSchema = mongoose.Schema({
    userName: String,
    gameName: String,
    price: Number
});

const cartOrdersModel = mongoose.model('cartOrders',cartordersSchema)

///////////////////////////////////////////////////////////////////////////////////////////////

// login page //
app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/client/login.html')

});

// signup page //
app.post('/SignUp',async(req,res)=>{
    let temp = {
        userName: req.body.userName,
        email: req.body.email,
        password: req.body.password
    }
    // checking if the email that the user enters does exist
    let emailresult = await userModel.findOne({email:req.body.email});

    if(emailresult){
        return res.status(400).send('<script>alert("Email is already in use"); window.location.href = "/SignUp.html";</script>');
    }

    await userModel.create(temp);

    console.log(`user ${req.body.userName} has been added`);
    res.sendFile(__dirname+'/client/Login.html');
});

// if the user didnt log in it wont show the pages(middleware) //
function userChecker(req,res,next){
    const userName = req.session.userName;
    if(userName != undefined){
        next()
    }else{
        res.status(400).send("error")
    }
}



// main page(posting to check if the user exists)(login page) //
app.post('/main',async (req,res)=>{   
    let resEmail = req.body.email;
    let resPass = req.body.password;
    let result = await userModel.findOne({
        email:resEmail,
        password: resPass
    })
    try{
        if(result != null)
        {
            req.session.userName = result.userName;
            res.sendFile(__dirname+"/client/Main.html")
        }
        else{
            res.status(400).send('<script>alert("please check your email/password"); window.location.href = "/";</script>')
        }
    }catch(e){
        console.log(e.message);
    }
    
});

// if deleteing db dont work, comment this //
// app.use(userChecker);


// if the user is trying to go directly to /main it will send him to login.html //
app.get('/main',async (req,res)=>{
    res.sendFile(__dirname+ '/client/Login.html')
});


// creating game array and inserting it to the db //
let games = [
    {
        gameName: "ratchet",
        id: 1,
        price: 39.99,
        genre: "singleplayer",
        imagePath: 'imgs/ratchet.jpg'
    },
    {
        gameName: "Immortals",
        id: 2,
        price: 4.99,
        genre: "singleplayer",
        imagePath: 'imgs/images.jpg'
    },
    {
        gameName: "Halo",
        id: 3,
        price: 24.99,
        genre: "multiplayer",
        imagePath: 'imgs/mp.jpg'
    },
    {
        gameName: "Splinter Cell",
        id: 4,
        price: 29.99,
        genre: "action",
        imagePath: 'imgs/action.jpg'
    },
    {
        gameName: "Call of duty",
        id: 5,
        price: 44.99,
        genre: "multiplayer",
        imagePath: 'imgs/cod.jpg'
    },
    {
        gameName: "Find Me",
        id: 6,
        price: 15.99,
        genre: "horror",
        imagePath: 'imgs/horror.jpg'
    },

];



// adding games to the db, if games exist, dont add //
const addGameToDB = async ()=>{
    const existingGames = await gameModel.find();
    
    if (existingGames.length === 0) {
        await gameModel.insertMany(games);
        console.log("Added games to the database");
    } else {
        console.log("Games already exist in the database. Skipping insertion.");
    }
};
addGameToDB();

// getting all the games from the db
app.get('/getGames',async(req,res)=>{
    res.send(await gameModel.find());

})


// adding games to the cart and saving in the db //
app.post('/addToCart', async (req, res) => {
    const userName = req.session.userName;
    const cartGameList = req.body.cartGameList.map(item => ({ ...item, userName: userName }));

    if(cartGameList.length > 0){
     await cartModel.create(cartGameList);
     console.log('Cart items added successfully:',cartGameList);
    }
});

// showing the cart in the /cart.html page //
app.get('/checkout',async(req,res)=>{
    const userName = req.session.userName;
    const cartData = await cartModel.find({userName: userName})
    res.send(cartData);

})

// buy button that sends the cart to cartOrdersDB //
app.post('/buy',async(req,res)=>{
    const userName = req.session.userName;
    const cartOrder = req.body.cartOrder.map(item =>({...item,userName:userName}));
    try{
    if(cartOrder.length > 0){
        await cartOrdersModel.create(cartOrder);
        await cartModel.deleteMany({})
        console.log(`Order ${JSON.stringify(cartOrder)} was successfully sent to the database`);
        return res.status(200).redirect('/');
    }else{
        return res.status(400).send('Cart is empty. Cannot proceed with the order.');
    }
}catch(error){
    console.log(error);
}
})







// middleware checks if user is admin = true in query
function isAdmin(req, res, next) {
    if (req.query.admin === "true") {
        next();
    } else {
        res.status(403).send("Access denied. You do not have admin privileges.");
    }
}


// app.use(isAdmin)


app.get('/all',async(req,res)=>{
    try {
        const cartOrders = await cartOrdersModel.find();
        const formattedOrders = cartOrders.map(item => {
            return `
            <div style= "display:block">
                <h2>${item.userName}'s order:</h2>
                <p>${item.gameName}.</p>
                <p>${item.price}$.</p>
            </div>`;
        });

        res.send(`Here are all the orders:${formattedOrders}`);
    } catch (error) {
        console.error('Error fetching all orders:', error);
        res.status(500).send('Internal Server Error');
    }
});














// deleting db's
app.delete('/deleteAllUsers',isAdmin, async (req, res) => {
    try {
        await userModel.deleteMany({});
        console.log('All user documents deleted');
        res.status(200).send('All user documents deleted');
    } catch (error) {
        console.error(error);
    }
});

app.delete('/deleteAllGames', isAdmin, async (req, res) => {
    try {
        await gameModel.deleteMany({});
        console.log('All game documents deleted');
        res.status(200).send('All game documents deleted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.delete('/deleteAllCarts',isAdmin, async (req, res) => {
    try {
        await cartModel.deleteMany({});
        console.log('All carts documents deleted');
        res.status(200).send('All carts documents deleted');
    } catch (error) {
        console.error(error);
    }
});

app.delete('/deleteAllCartOrders',isAdmin, async (req, res) => {
    try {
        await cartOrdersModel.deleteMany({});
        console.log('All cart orders documents deleted');
        res.status(200).send('All cart orders documents deleted');
    } catch (error) {
        console.error(error);
    }
});




app.listen(PORT,()=>{console.log(`server is running on: ${PORT}`)});