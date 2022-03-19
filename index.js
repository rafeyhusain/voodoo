const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

app.get('/api/games', (req, res) => db.Game.findAll()
  .then(games => res.send(games))
  .catch((err) => {
    console.log('There was an error querying games', JSON.stringify(err));
    return res.send(err);
  }));

app.post('/api/games', (req, res) => {
  return createGame(req.body)
    .then(game => res.send(game))
    .catch((err) => {
      console.log('***There was an error creating a game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

const createGame = (game) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = game;
  return db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
}

app.delete('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then(game => game.destroy({ force: true }))
    .then(() => res.send({ id }))
    .catch((err) => {
      console.log('***Error deleting game', JSON.stringify(err));
      res.status(400).send(err);
    });
});

app.put('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => {
      const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
      return game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
        .then(() => res.send(game))
        .catch((err) => {
          console.log('***Error updating game', JSON.stringify(err));
          res.status(400).send(err);
        });
    });
});

app.post('/api/games/search', (req, res) => {
  const { name, platform } = req.body;

  if (!name && !platform) {
    return res.redirect('/api/games');
  }

  return db.Game.findAll({ where: {name:name, platform:platform })
    .then(games => res.send(games))
    .catch((err) => {
      console.log('***There was an error searching a game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.post('/api/games/populate', (req, res) => {
  const urlAndroid = `https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/android.top100.json`
  const urlIos = `https://interview-marketing-eng-dev.s3.eu-west-1.amazonaws.com/ios.top100.json`

  populateGames(req, res, "android", urlAndroid)
  populateGames(req, res, "ios", urlIos)

  res.status(200).send("ok")
});

const populateGames = (req, res, platform, url) => {
  axios.get(url, {})
  .then((response) => {
    response.data.forEach(game => 
      {
        const game = { 
          publisherId: game.publisher_id, 
          name: game.humanized_name, 
          platform: platform, 
          storeId: game.publisher_id, 
          bundleId: game.bundle_id, 
          appVersion: game.version, 
          isPublished: true 
        };
    
        return createGame(game)
        .then(game => res.send(game))
        .catch((err) => {
          console.log('***There was an error populating android game', JSON.stringify(err));
          return res.status(400).send(err);
        });
      });
  })
}

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
