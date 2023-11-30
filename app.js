const express = require("express"); //express is web framework for nodejs , helps in building web application
const bodyParser = require("body-parser"); //extracts the entire body portion of an incoming request stream & exposes it on req.body. It is used to handle HTTP post requests.
// const date = require(__dirname + "/date.js");     //here 'date' will be getting the function so to use date use date() to make it behave like a function
const mongoose = require("mongoose");
var _ = require("lodash");

const app = express(); //create an instance of express application , which will be used to define routes & start server.

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.json());

app.set("view engine", "ejs");

const itemSchema = new mongoose.Schema({
  //creating an itemSchema , for simplicity creating a table with table name
  name: String,
});

//creating a new mongoose model , based on itemSchema
const Item = mongoose.model("Item", itemSchema); // we call our model Item, 1st paramater is singular version of our collection name, 2nd parameter is the name of schema which we are going to use this item collection.

let defaultItems = []; //this is a global array which is currently empty.

//creating a list schema.
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

//creating a List model
const List = mongoose.model("List", listSchema);

async function main() {
  try {
    await mongoose.connect(
      "mongodb+srv://aaryan:1234@cluster0.4oddc8e.mongodb.net/todolistDB"
    ); //creating a new Database inside mongodb, here the name of our database is todolistDB

    //creating 3 documents for our model
    const item1 = new Item({
      name: "Welcome to ToDoList.",
    });
    const item2 = new Item({
      name: "Hit + to enter a new item",
    });
    const item3 = new Item({
      name: "<-- Hit to delete an item.",
    });
    //creating a single array for our items
    defaultItems = [item1, item2, item3];
  } catch (error) {
    console.log("Error: ", error); //printing any error if occurs
  } finally {
    //   await mongoose.connection.close();                      //closing our connection.
    //   console.log("Server closed.")
  }
}

//this is an async function which means can do other tasks till this functions executes.
async function getItems() {
  const temp = await Item.find({}); //this function fecthes the data from our database, and return it, here it will fetch raw data and it will of array datatype.
  return temp;
}

async function getListItem() {
  //this function will return an array containing all content of List model.
  const temp = await List.find({});
  return temp;
}

async function deleteItem(temp) {
  //here temp is an id , and this function is deleting item associated with this id.
  await Item.findByIdAndDelete(temp);
}

app.get("/", async function (req, res) {
  //defines a route path '/' , when a GET request is made to root path, the callback function is executed.

  const temp = await getItems(); //here we are fetching data from getItems() fucntions

  if (temp.length === 0) {
    await Item.insertMany(defaultItems);
  }

  res.render("list", { listTitle: "Today", listItem: temp });
  // console.log(i.name);
});

app.post("/delete", async function (req, res) {
  try {
    const checkedItemId = req.body.checkbox; //we are reading the value of checkbox in list.ejs , here it will return the id of item of whose checkbox is ticked.
    const listName = req.body.listName; // this has name of our customeListName

    //find the customeListName in list , then delete its items which matches the id of checkedItemId
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );

    //if we wanna delete at home route, i.e its title will be today.
    if (listName === "Today") {
      await deleteItem(checkedItemId);
      res.redirect("/");
    } else {
      //or else we are at custome url
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.error("Error deleting item: ", err);
    res.status(500).send("Error deleting item");
  }
});

app.get("/:customListName", async function (req, res) {
  if (req.params.customListName.toLowerCase() === "favicon.ico") {
    return res.status(204).end(); // Ignore favicon.ico requests
  }
  let found = false; //variable to check if listName is there in LIST.
  const customListName = _.upperFirst(req.params.customListName); //uppercase first letter of the customURL

  const arr = await getListItem(); //this array is containing all content of List.

  for (let i = 0; i < arr.length; i++) {
    //traversing this array
    if (arr[i].name === customListName) {
      //if name of any List item is equals to customURL then we found a URL which was already there.
      found = true; //make our flag to true.
      res.render("list", { listTitle: customListName, listItem: arr[i].items }); //diplay that page.
      break;
    }
  }
  if (!found) {
    //if somehow we didn't found that name in array , then it means that it was not created and we have to create a List for that customURL
    //creating new list document based on listSchema
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    //save our document in list collection
    await list.save();
    res.render("list", { listTitle: customListName, listItem: list.items });
  }
});

app.post("/", async function (req, res) {
  // handling post request from our form in our home route.
  const itemName = req.body.listItem; // using body parser.

  // creating a document for itemName based on our model
  const item = new Item({
    name: itemName,
  });
  // console.log(item);


  // Check if it's a custom list
  const listName = req.body.list;
  if (listName) {
    try {
      // Find the custom list by name
      const list = await List.findOne({ name: listName });

      // If the list exists, add the item to it
      if (list) {
        list.items.push(item);
        await list.save();

        console.log("itemName : "+itemName +"item : "+item+"list : "+list+" listName : "+listName)
        
          res.redirect("/" + listName); // Redirect to the custom list
        return;
      }
    } catch (error) {
      console.error("Error adding item to custom list:", error);
      res.redirect("/");
      return;
    }
  }

  // If it's not a custom list, save the item as usual
  await item.save();
  res.redirect("/");
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function (req, res) {
  console.log("Server is running on port 3000");
});

//calling main async function
main();
