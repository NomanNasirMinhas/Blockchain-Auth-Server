const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();
const { performance } = require("perf_hooks");
const Web3 = require("web3");
const mongodb = require("mongodb").MongoClient;
const contract = require("truffle-contract");
const artifacts = require("./build/Inbox.json");
// const shortid = require("short-id");
// const IPFS = require("ipfs-api");
// const ipfs = IPFS({ host: "ipfs.infura.io", port: 5001, protocol: "https" });
const routes = require("./routes");

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require("node-localstorage").LocalStorage;
  localStorage = new LocalStorage("./scratch");
}

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.use(cors());
app.use(express.json());
if (typeof web3 !== "undefined") {
  var web3 = new Web3(web3.currentProvider);
} else {
  var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}
const LMS = contract(artifacts);
LMS.setProvider(web3.currentProvider);

const uri =
  "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";

const server = app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

mongodb.connect(uri, { useUnifiedTopology: true }, async (err, client) => {
  if (err) return console.error(err);
  try {
    const db = client.db("local");
    const accounts = await web3.eth.getAccounts();
    const lms = await LMS.deployed();
    //home
    routes(app, db, lms, accounts);
  } catch (e) {
    console.log(e);
  }

  app.get("/", (req, res) => {
    res.status(201).json("Welcome to Blockchain Server");
  });

  app.get("/clear", (req, res) => {
    localStorage.clear();
    res.status(201).json("Cleared");
  });

  app.get("/port", (req, res) => {
    res.status(201).json(server.address().port);
  });

  //GET ALL ADDRESSES CALL
  app.get("/getResponseTime/:type", async (req, res) => {
    const type = req.params.type;
    try {
      var respTime = localStorage.getItem(`responseTime${type}`);
      if (respTime != undefined) res.status(201).json(Number(respTime));
      else res.status(201).json(Number.POSITIVE_INFINITY);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

});

