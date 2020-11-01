const express = require("express");
const app = express();
const download = require("download");
const fs = require("fs");
const http = require("http").createServer(app);
const { json } = require("body-parser");
app.use(json());

//simple database
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);
db.defaults({ profiles: [] }).write();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.use("/photos", express.static("photos"));

app.get("/profiles", (req, res) => {
  let user = req.query["user"];
  let profile = db.get("profiles").find({ user: user }).value();
  console.log("get profile", profile);
  if (!profile) {
    profile = { user: user };
    db.get("profiles").push(profile).write();
  }
  res.json(profile);
});

app.post("/webhook", (req, res) => {
  console.log("webhook", req.body);
  let body = req.body;
  let user = body.reference;
  let answers = body.answers.filter((a) => a.reference === "profile_picture");
  if (answers.length > 0) {
    let answer = answers[0];
    let photoPath = `photos/${user}_profile_picture`;
    (async () => {
      fs.writeFileSync(photoPath, await download(answer.mediaUrl));
      console.log("file saved");
      db.get("profiles")
        .find({ user: user })
        .assign({ photo: photoPath })
        .write();
      console.log("webhook", "saved profile");
    })();
  }
  res.status(200).end();
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
