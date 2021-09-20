import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client({
  user: "academy",
  password: "",
  host: "localhost",
  port: 5432,
  database: "pastebin",
}); // define the client config
client.connect();

app.get("/", async (req, res) => {
  const dbres = await client.query("select * from pastebin");
  res.json(dbres.rows);
});

// add user input
app.post("/input", async (req, res) => {
  try {
    const { title, description } = req.body;
    const newPost = await client.query(
      "INSERT INTO pastebin (post_description , post_title) VALUES($1 , $2)",
      [description, title]
    );
    res.json(newPost);
  } catch (err) {
    console.log(err.message);
  }
});

// Users should be able to see a list of recent posts, in reverse chronological order.
app.get("/viewpost", async (req, res) => {
  try {
    const allPosts = await client.query(
      "SELECT * FROM pastebin ORDER BY post_id DESC"
    );
    res.json(allPosts.rows);
  } catch (err) {
    console.log(err.message);
  }
});

// get information on single post
app.get("/post/:id", async (req, res) => {
  try {
    const { id } = req.params; // req.params An object containing parameter values parsed from the URL path.
    const post = await client.query(
      "SELECT * FROM pastebin where post_id = $1",
      [id]
    );

    res.json(post.rows[0]);
    // returns first item for one post
  } catch (err) {
    console.log(err.message);
  }
});

// allows user to delete post
app.delete("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTodo = await client.query(
      "delete from pastebin where post_id = $1",
      [id]
    );
    res.json("post was deleted");
  } catch (err) {
    console.log(err.message);
  }
});

// allow  user to edit the post
app.put("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const editTodo = await client.query(
      "update pastebin set post_description = $1 where post_id = $2",
      [description, id]
    );
    res.json("post was edited");
  } catch (err) {
    console.log(err.message);
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});

// Clicking on any post in the list should reveal the full relevant post in a large area to the side of the list.

//
