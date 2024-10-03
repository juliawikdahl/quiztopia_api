const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const docClient = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE;


module.exports.signup = async (event) => {
    const { username, password } = JSON.parse(event.body);
    const userId = uuidv4(); 

    const params = {
      TableName: USERS_TABLE,
      Item: {
        userId,    
        username,
        password, 
      },
    };

    try {
      
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


module.exports.login = async (event) => {
  const { username, password } = JSON.parse(event.body);

  const params = {
    TableName: USERS_TABLE,
    Key: { username },
  };

  try {
    const data = await docClient.get(params).promise();
    if (!data.Item || data.Item.password !== password) { 
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Ogiltigt användarnamn eller lösenord' }),
      };
    }

    const { userId } = data.Item;  

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


// const authenticateJWT = (req, res, next) => {
//   const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ success: false, error: 'Ingen token tillhandahållen' });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ success: false, error: 'Ogiltlig token' });
//     }
//     req.user = user;
//     next();
//   });
// };

// module.exports.authenticateJWT = authenticateJWT;





// koden fast med middy 
// const AWS = require('aws-sdk');
// const jwt = require('jsonwebtoken');
// const { v4: uuidv4 } = require('uuid');
// const docClient = new AWS.DynamoDB.DocumentClient();
// const USERS_TABLE = process.env.USERS_TABLE;

// const middy = require('@middy/core');
// const httpErrorHandler = require('@middy/http-error-handler');

// Autentisering middleware
// const authenticateJWT = async (event) => {
//     const token = event.headers.Authorization || event.headers.authorization;

//     if (!token) {
//         throw new Error('Ingen token tillhandahållen');
//     }

//     return new Promise((resolve, reject) => {
//         jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//             if (err) {
//                 return reject(new Error('Ogiltlig token'));
//             }
//             event.user = user; 
//             resolve(event);
//         });
//     });
// };

//  Registrera en ny användare
// const signup = async (event) => {
//     const { username, password } = JSON.parse(event.body);
//     const userId = uuidv4();

//     const params = {
//         TableName: USERS_TABLE,
//         Item: {
//             userId,
//             username,
//             password,
//         },
//     };

//     try {
//         const existingUser = await docClient.get({
//             TableName: USERS_TABLE,
//             Key: { username },
//         }).promise();

//         if (existingUser.Item) {
//             return {
//                 statusCode: 409,
//                 body: JSON.stringify({ error: 'Användarnamnet finns redan' }),
//             };
//         }

//         await docClient.put(params).promise();
//         return {
//             statusCode: 201,
//             body: JSON.stringify({ message: 'Användare skapad' }),
//         };
//     } catch (error) {
//         console.error('Fel vid skapande av användare:', error);
//         return {
//             statusCode: 500,
//             body: JSON.stringify({ error: 'Fel vid skapande av användare', details: error.message }),
//         };
//     }
// };

//  Logga in en användare
// const login = async (event) => {
//     const { username, password } = JSON.parse(event.body);

//     const params = {
//         TableName: USERS_TABLE,
//         Key: { username },
//     };

//     try {
//         const data = await docClient.get(params).promise();
//         if (!data.Item || data.Item.password !== password) {
//             return {
//                 statusCode: 401,
//                 body: JSON.stringify({ error: 'Ogiltigt användarnamn eller lösenord' }),
//             };
//         }

//         const { userId } = data.Item;

//         const token = jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: '1h' });
//         return {
//             statusCode: 200,
//             body: JSON.stringify({ token }),
//         };
//     } catch (error) {
//         console.error('Fel vid inloggning:', error);
//         return {
//             statusCode: 500,
//             body: JSON.stringify({ error: 'Fel vid inloggning' }),
//         };
//     }
// };

// Wrappa funktionerna med Middy och lägg till autentisering och felhantering
// module.exports.signup = middy(signup).use(httpErrorHandler());
// module.exports.login = middy(login).use(httpErrorHandler());
// module.exports.authenticateJWT = authenticateJWT; 
