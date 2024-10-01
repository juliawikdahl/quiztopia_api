const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const docClient = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE;

// Skapa en ny användare
module.exports.signup = async (event) => {
    const { username, password } = JSON.parse(event.body);
    const userId = uuidv4(); // Generera ett unikt userId

    const params = {
      TableName: USERS_TABLE,
      Item: {
        userId,    // Lägg till userId
        username,
        password,  // Tänk på att hash:a lösenord innan du sparar det
      },
    };

    try {
      // Kontrollera om användarnamnet redan finns
      const existingUser = await docClient.get({
        TableName: USERS_TABLE,
        Key: { username },
      }).promise();

      if (existingUser.Item) {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: 'Användarnamnet finns redan' }),
        };
      }

      await docClient.put(params).promise();
      return {
        statusCode: 201,
        body: JSON.stringify({ message: 'Användare skapad' }),
      };
    } catch (error) {
      console.error('Fel vid skapande av användare:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Fel vid skapande av användare', details: error.message }),
      };
    }
};

// Logga in användare och skapa JWT
module.exports.login = async (event) => {
  const { username, password } = JSON.parse(event.body);

  const params = {
    TableName: USERS_TABLE,
    Key: { username },
  };

  try {
    const data = await docClient.get(params).promise();
    if (!data.Item || data.Item.password !== password) { // Hasha lösenord för säkerhet
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Ogiltigt användarnamn eller lösenord' }),
      };
    }

    const { userId } = data.Item;  // Hämta userId från databasen

    const token = jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (error) {
    console.error('Fel vid inloggning:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fel vid inloggning' }),
    };
  }
};

// Middleware för att autentisera JWT
const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Ingen token tillhandahållen' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Ogiltlig token' });
    }
    req.user = user;
    next();
  });
};

module.exports.authenticateJWT = authenticateJWT;
