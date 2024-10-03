const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const docClient = new AWS.DynamoDB.DocumentClient();
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;


module.exports.getQuizzes = async () => {
  const params = {
    TableName: QUIZZES_TABLE,
  };

  try {
    const data = await docClient.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, quizzes: data.Items }),
    };
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fel vid hämtning av quiz' }),
    };
  }
};

module.exports.createQuiz = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const cleanToken = token.replace('Bearer ', '');
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { name } = JSON.parse(event.body);
    const quizId = uuidv4();

    const params = {
      TableName: QUIZZES_TABLE,
      Item: {
        userId,
        quizId,
        name,
        questions: [],
      },
    };

    await docClient.put(params).promise();

    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, quizId }),
    };
  } catch (error) {
    console.error('Fel vid skapande av quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fel vid skapande av quiz' }),
    };
  }
};


module.exports.addQuestion = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const cleanToken = token.replace('Bearer ', '');
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { quizId, question, answer, longitude, latitude } = JSON.parse(event.body);

    const params = {
      TableName: QUIZZES_TABLE,
      Key: { quizId, userId },
      UpdateExpression: 'SET questions = list_append(questions, :question)',
      ExpressionAttributeValues: {
        ':question': [{
          question,
          answer,
          location: {
            longitude,
            latitude,
          },
        }],
      },
      ReturnValues: 'UPDATED_NEW',
    };

    await docClient.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Fel vid tillägg av fråga:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fel vid tillägg av fråga' }),
    };
  }
};


module.exports.getQuiz = async (event) => {
  const userId = event.pathParameters.userId; 
  const quizId = event.pathParameters.quizId; 

  const params = {
    TableName: QUIZZES_TABLE,
    Key: {
      userId,
      quizId,
    },
  };

  try {
    const data = await docClient.get(params).promise();
    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, error: 'Quiz inte hittat' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, quiz: data.Item }),
    };
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Fel vid hämtning av quiz', details: error.message }),
    };
  }
};


module.exports.deleteQuiz = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const cleanToken = token.replace('Bearer ', '');

    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { quizId } = event.pathParameters; 

    const params = {
      TableName: QUIZZES_TABLE,
      Key: {
        userId,  
        quizId, 
      },
    };

    const quiz = await docClient.get(params).promise();

    if (!quiz.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'Quiz inte hittat' }),
      };
    }

    await docClient.delete(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Quiz raderat' }),
    };
  } catch (error) {
    console.error('Fel vid radering av quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Fel vid radering av quiz', error: error.message }),
    };
  }
};


// koden med middy
// const AWS = require('aws-sdk');
// const jwt = require('jsonwebtoken');
// const { v4: uuidv4 } = require('uuid');
// const docClient = new AWS.DynamoDB.DocumentClient();
// const QUIZZES_TABLE = process.env.QUIZZES_TABLE;


// const middy = require('@middy/core');
// const httpErrorHandler = require('@middy/http-error-handler');

// Middleware för autentisering
// const authenticateJWT = async (event) => {
//     const token = event.headers.Authorization || event.headers.authorization;

//     if (!token) {
//         throw new Error('Ingen token tillhandahållen');
//     }

//     const cleanToken = token.replace('Bearer ', '');
//     return new Promise((resolve, reject) => {
//         jwt.verify(cleanToken, process.env.JWT_SECRET, (err, user) => {
//             if (err) {
//                 return reject(new Error('Ogiltlig token'));
//             }
//             event.user = user; 
//             resolve(event);
//         });
//     });
// };

// Hämta alla quizzes
// const getQuizzes = async () => {
//     const params = {
//         TableName: QUIZZES_TABLE,
//     };

//     try {
//         const data = await docClient.scan(params).promise();
//         return {
//             statusCode: 200,
//             body: JSON.stringify({ success: true, quizzes: data.Items }),
//         };
//     } catch (error) {
//         console.error('Fel vid hämtning av quiz:', error);
//         return {
//             statusCode: 500,
//             body: JSON.stringify({ error: 'Fel vid hämtning av quiz' }),
//         };
//     }
// };

// Skapa en ny quiz
// const createQuiz = async (event) => {
//     const { name } = JSON.parse(event.body);
//     const quizId = uuidv4();
//     const userId = event.user.userId; 

//     const params = {
//         TableName: QUIZZES_TABLE,
//         Item: {
//             userId,
//             quizId,
//             name,
//             questions: [],
//         },
//     };

//     await docClient.put(params).promise();
//     return {
//         statusCode: 201,
//         body: JSON.stringify({ success: true, quizId }),
//     };
// };

// Lägg till en fråga i en quiz
// const addQuestion = async (event) => {
//     const { quizId, question, answer, longitude, latitude } = JSON.parse(event.body);
//     const userId = event.user.userId; 

//     const params = {
//         TableName: QUIZZES_TABLE,
//         Key: { quizId, userId },
//         UpdateExpression: 'SET questions = list_append(questions, :question)',
//         ExpressionAttributeValues: {
//             ':question': [{
//                 question,
//                 answer,
//                 location: {
//                     longitude,
//                     latitude,
//                 },
//             }],
//         },
//         ReturnValues: 'UPDATED_NEW',
//     };

//     await docClient.update(params).promise();
//     return {
//         statusCode: 200,
//         body: JSON.stringify({ success: true }),
//     };
// };

// Hämta en specifik quiz
// const getQuiz = async (event) => {
//     const userId = event.pathParameters.userId;
//     const quizId = event.pathParameters.quizId;

//     const params = {
//         TableName: QUIZZES_TABLE,
//         Key: {
//             userId,
//             quizId,
//         },
//     };

//     const data = await docClient.get(params).promise();
//     if (!data.Item) {
//         return {
//             statusCode: 404,
//             body: JSON.stringify({ success: false, error: 'Quiz inte hittat' }),
//         };
//     }

//     return {
//         statusCode: 200,
//         body: JSON.stringify({ success: true, quiz: data.Item }),
//     };
// };

// Ta bort en quiz
// const deleteQuiz = async (event) => {
//     const quizId = event.pathParameters.quizId;
//     const userId = event.user.userId; 

//     const params = {
//         TableName: QUIZZES_TABLE,
//         Key: {
//             userId,
//             quizId,
//         },
//     };

//     const quiz = await docClient.get(params).promise();
//     if (!quiz.Item) {
//         return {
//             statusCode: 404,
//             body: JSON.stringify({ success: false, message: 'Quiz inte hittat' }),
//         };
//     }

//     await docClient.delete(params).promise();
//     return {
//         statusCode: 200,
//         body: JSON.stringify({ success: true, message: 'Quiz raderat' }),
//     };
// };

// Exportera Lambda-funktionerna med middy och middleware
// module.exports.getQuizzes = middy(getQuizzes).use(httpErrorHandler());
// module.exports.createQuiz = middy(createQuiz).use(authenticateJWT).use(httpErrorHandler());
// module.exports.addQuestion = middy(addQuestion).use(authenticateJWT).use(httpErrorHandler());
// module.exports.getQuiz = middy(getQuiz).use(httpErrorHandler());
// module.exports.deleteQuiz = middy(deleteQuiz).use(authenticateJWT).use(httpErrorHandler());
