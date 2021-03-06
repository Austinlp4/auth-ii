const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('./database/dbConfig.js');

const server = express();

server.use(express.json());
server.use(cors());

server.get('/', (req, res) => {
    res.send('Its Alive!');
  });

server.post('/api/register', (req, res) => {
    const credentials = req.body;

    const hash = bcrypt.hashSync(credentials.password, 10);
    credentials.password = hash;

    db('users')
      .insert(credentials)
      .then(ids => {
          const id = ids[0];
          res.status(201).json({ newUserId: id });
      })
      .catch(err => {
          res.status(500).json(err);
      });
});

const jwtSecret = 'Coffee is in my DNA';

function generateToken(user) {
    const jwtPayload = {
        ...user, 
        hello: 'User',
        role: 'admin'
    };

    const jwtOptions = {
        expiresIn: '5m',
    }

    return jwt.sign(jwtPayload, jwtSecret, jwtOptions);
}

server.post('/api/login', (req, res) => {
    const creds = req.body;

    db('users')
      .where({ username: creds.username })
      .first()
      .then(user => {
          if(user && bcrypt.compareSync(creds.password, user.password)) {
              const token = generateToken(user);
              res.status(200).json({ welcome: user.username, token });
          } else {
              res.status(401).json({ message: 'You have been denied access' });
          }
      })
      .catch(err => {
          res.status(500).json({ err })
      });
});

server.get('/api/users', protected, (req, res) => {
    db('users')
      .select('id', 'username', 'password')
      .then(users => {
          res.json({ users });
      })
      .catch(err => res.send(err));
});

function protected(req, res, next) {
    const token = req.headers.authorization;

    if(token) {
        jwt.verify(token, jwtSecret, (err, decodedToken) => {
            if(err) {
                res.status(401).json({ message: 'invalid Token' });
            } else {
                req.decodedToken = decodedToken;
                next();
            }
        })
    } else {
        res.status(401).json({ message: 'no token has been provided' });
    }
}

server.listen(3300, () => console.log('\nrunning on port 3300\n'));