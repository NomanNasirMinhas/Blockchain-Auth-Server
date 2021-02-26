const shortid = require("short-id");
const IPFS = require("ipfs-api");
const ipfs = IPFS({ host: "ipfs.infura.io", port: 5001, protocol: "https" });
const { performance } = require("perf_hooks");
const fetch = require("node-fetch");

function routes(app, dbe, lms, accounts) {
  let db = dbe.collection("bcc-users");
  let music = dbe.collection("bcc-store");

  app.post('/register', async (req,res)=>{
    let profile = req.body.profile
    let uname = req.body.uname
    // let title = req.body.title
    let id = shortid.generate() + shortid.generate()
    if(profile && uname){
        var buffer = Buffer.from(profile);
        var t1 = performance.now();
        let ipfsHash = await ipfs.add(buffer);
        let hash = ipfsHash[0].hash
        lms.sendIPFS(id, hash, {from: accounts[0]})
        .then((_hash, _address)=>{
            music.insertOne({id,hash,uname})
            res.status(201).json({"success":true, "token":id, "time": (performance.now() - t1)})
        })
        .catch(err=>{
            res.status(500).json({"success":false, "err":err})
        })
    }else{
        res.status(400).json({"success":false, "reason":"wrong input"})
    }
})

app.get('/login/:uname&:id', (req,res)=>{
  let id = req.params.id
  let uname = req.params.uname;
  console.log("Request = ", id, uname)
    if(id && uname){
        music.findOne({uname:uname},(err,doc)=>{
          console.log("Doc retrieved = ", doc)
            if(doc){
                var t1 = performance.now();
                lms.getHash(id, {from: accounts[0]})
                .then(async(hash)=>{
                    let data = await ipfs.files.get(hash)
                    res.status(201).json({"success":true, "data": data[0].content.toString(), "time": (performance.now()-t1)})
                })
            }else{
                res.status(400).json({"success":false, "reason":"No Doc Found"})
            }
        })
    }else{
        res.status(400).json({"success":false, "reason":"Missing Params"})
    }
});

}

module.exports = routes;
