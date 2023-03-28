//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
//require mongoose
const mongoose  = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

dotenv.config();
//create mongo database
const url = process.env.MONGO_URL;
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(url);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}



//create schema
const itemsSchema = new mongoose.Schema({
  name: String
});

//create Model

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist"
});
const item2 = new Item({
  name: "Hit the + button to aff a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item>"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);




app.get("/", function(req, res) {

  Item.find({}).then(function(foundItems){

    if(foundItems.length === 0){

      // Add items into the db
      Item.insertMany(defaultItems).then(function(){
        console.log("Items inserted Successfully");
      }).catch(function (err){
        console.log(err);
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

app.post("/", async (req, res)=>{

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if(listName=== "Today"){
    item.save();
    res.redirect("/");
  }else{
    await List.findOne({name:listName}).exec().then(foundList => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
      }).catch(err =>{
        console.log(err);
      })
  }

});

app.post("/delete", function(req, res){
  const checkedItemId= req.body.checkbox;
  const listName =  req.body.listName;
  
  if(listName=== "Today"){
    Item.findById(checkedItemId).then(function(){
      console.log(checkedItemId);
      Item.deleteOne({_id: checkedItemId}).then(function(){
        console.log("Item was successfully removed!");
      });
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({
      name: listName
    },{
      $pull: {items:{_id:checkedItemId}}
    }).then(function(foundList){
      res.redirect("/"+listName);
    });
  }


});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name:customListName}).then(function(foundList){
    if(!foundList){
      const list = new List({
        name: customListName,
        items: defaultItems
      });
    
      list.save();
      res.redirect("/"+customListName);
    }else{
      res.render("list", {listTitle:foundList.name, newListItems: foundList.items});
    }
  });

});

app.get("/about", function(req, res){
  res.render("about");
});

connectDB().then(() => {
  app.listen(process.env.PORT || 3000, () => {
      console.log("listening for requests");
  })
})
