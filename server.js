require('dotenv').config(); 
const express = require("express");
const app = express();
const mongoose = require('mongoose');
const _ = require('lodash');
const PORT = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set('views', 'views')

// disables strict query and records entered does not need to follow schema
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connect: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

// create schema to store to-do tasks
const itemsSchema = new mongoose.Schema({
  name: String
});

// create model/table
const Item = mongoose.model('item', itemsSchema);

// create records/documents
const task1 = new Item ({
  name: 'Buy Food'
});

const task2 = new Item ({
  name: 'Cook Food'
});

const task3 = new Item ({
  name: 'Eat Food'
});

const defaultItems = [task1, task2, task3];

//  create schema to store new created lists

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('list', listSchema);

app.get("/", function (req, res) {

  // Array through Item model to log task names
  Item.find({})
    // foundItems param stores all the found data in model Item
    .then((foundItems) => {

      if(foundItems.length === 0){
        // insert documents via array only if no items in defaultItems
        Item.insertMany(defaultItems)
        .then(() => console.log('Successfully Added to To-Do List'))
        .catch((err) => console.log(err));

        res.redirect('/');
      } else {
        res.render("list", {
          listTitle: 'Today',
          newToDos: foundItems
        });
      }
  }) .catch((err) => console.log(err));


});

app.get('/:customToDoList', (req,res) => {
  const listName = _.capitalize(req.params.customToDoList);

  List.findOne({name: listName})
  .then((foundList) => {
    if(!foundList){
      // create a new list
      const list = new List ({
        name: listName,
        items: defaultItems
      });
      list.save();
      res.redirect(`/${listName}`);
    } else {
      // show existing list passing foundList name and items
      res.render('list', {
        listTitle: foundList.name,
        newToDos: foundList.items
      }); 
    }    
  })
  .catch((err) => {
    console.log(err);
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const addTask = new Item ({
    name: itemName
  });

  if (listName === 'Today'){
    addTask.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName})
    .then((foundList) => {
      foundList.items.push(addTask);
      foundList.save();
      res.redirect(`/${listName}`);
    });
  }

});

app.post('/delete', (req,res) => {
  const checkedItemID = req.body.deleteItem;
  const checkedListName = req.body.listName;

  if (checkedListName === 'Today'){
    Item.findByIdAndDelete(checkedItemID)
    .then(() => {
      res.redirect('/');
    })
    .catch((err) => console.log(err));
  } else {
    List.findOneAndUpdate({name: checkedListName}, {$pull: {items: {_id: checkedItemID}}})
    .then((foundList) => res.redirect(`/${checkedListName}`))
    .catch((err) => console.log(err));
  }

});

app.get("/about", function(req,res){
  res.render('about');
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`);
  });
})
