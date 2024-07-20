const express = require('express');
const path=require('path');

const {open} = require('sqlite');
const sqlite3 = require('sqlite3');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

let cors = require('cors');
app.use(cors());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

// function to intialize database and server 

let intializeDatabaseAndServer=async()=>{
    try{
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        })
        app.listen(3000,()=>{
            console.log("Server running at http://localhost:3000/");
        })
    }
    catch(e){
        console.log(`DB Error:${e.message}`);
        process.exit(1);
    }
}

intializeDatabaseAndServer();


// API endpoint to register new user
app.post("/register/", async (request, response) => {
    const {username, email, password} = request.body;

    const hashedPassword = await bcrypt.hash(password, 10);
   

    const selectUserQuery = `SELECT * FROM user WHERE email = '${email}';`;

    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
            INSERT INTO
                user (email,username, password)
            VALUES
                (   '${email}',
                    '${username}',
                    '${hashedPassword}'
                );`;
        const dbResponse = await db.run(createUserQuery);
        response.status(200);
        response.send({ message: "User created successfully"});
     
    } else {
        response.status(400);
        
        response.send({errorMessage:"User already exists"});
    }

  });


// login user
app.post("/login/", async (request, response) => {
    const { email, password } = request.body;
    console.log(email, password);

    const selectUserQuery = `SELECT * FROM user WHERE email = '${email}';`;
    const dbUser = await db.get(selectUserQuery);


    if (dbUser === undefined) {
        response.status(400);
        
        response.send({ errorMessage:"Invalid user email"});
    } else {
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if (isPasswordMatched === true) {
            const payload = {
                email: email,
            };
            const jwtToken = jwt.sign(payload, "MY_SECRET_KEY");
            response.send({ jwtToken: jwtToken});


        } else {
            response.status(400);
            response.send({errorMessage: "Invalid password"});
        }
    }

  });
