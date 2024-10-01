const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const docClient = new AWS.DynamoDB.DocumentClient();
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;


// Hämta alla quiz
module.exports.getQuizzes = async (event) => {
    const params = {
      TableName: QUIZZES_TABLE,
    };
  
    try {
      const data = await docClient.scan(params).promise();
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          quizzes: data.Items, // Returnera quiz som hämtats
        }),
      };
    } catch (error) {
      console.error('Fel vid hämtning av alla quiz:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Fel vid hämtning av quiz', details: error.message }),
      };
    }
  };

// Skapa ett nytt quiz
module.exports.createQuiz = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const cleanToken = token.replace('Bearer ', '');

    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const userId = decoded.userId;  // Extrahera userId från token

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId saknas i token' }),
      };
    }

    const { name } = JSON.parse(event.body);
    const quizId = uuidv4();  // Skapa ett unikt quizId

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
      statusCode: 200,
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

// Lägg till en fråga till ett quiz
module.exports.addQuestion = async (event) => {
  try {
    const token = event.headers.Authorization || event.headers.authorization;
    const cleanToken = token.replace('Bearer ', '');

    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { quizId, question, answer, location } = JSON.parse(event.body);

    const params = {
      TableName: QUIZZES_TABLE,
      Key: { quizId, userId },
      UpdateExpression: 'SET questions = list_append(questions, :question)',
      ExpressionAttributeValues: {
        ':question': [{
          question,
          answer,
          location
        }],
      },
      ReturnValues: 'UPDATED_NEW',
    };

    const result = await docClient.update(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, quiz: result.Attributes }),
    };
  } catch (error) {
    console.error('Fel vid tillägg av fråga:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fel vid tillägg av fråga' }),
    };
  }
};


// Hämta ett specifikt quiz
module.exports.getQuiz = async (event) => {
    const userId = event.pathParameters.userId; // Hämta userId från path
    const quizId = event.pathParameters.quizId; // Hämta quizId från path
  
    const params = {
      TableName: QUIZZES_TABLE,
      Key: {
        userId: userId, // Använd userId som partition key
        quizId: quizId, // Använd quizId som sort key
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
        body: JSON.stringify({
          success: true,
          quiz: data.Item, // Returnera det hämtade quizet
        }),
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
      // Hämta token från headers
      const token = event.headers.Authorization || event.headers.authorization;
      const cleanToken = token.replace('Bearer ', '');
  
      // Verifiera token och hämta userId
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      const userId = decoded.userId;
  
      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'userId saknas i token' }),
        };
      }
  
      // Hämta quizId från URL-parametrar
      const quizId = event.pathParameters.quizId;
  
      // Definiera parameters för att ta bort quizet
      const params = {
        TableName: QUIZZES_TABLE,
        Key: {
          quizId,
          userId,  // Använd både quizId och userId för att säkerställa att rätt quiz raderas
        },
      };
  
      // Utför delete operation
      await docClient.delete(params).promise();
  
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Quiz raderades framgångsrikt' }),
      };
    } catch (error) {
      console.error('Fel vid radering av quiz:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Fel vid radering av quiz' }),
      };
    }
  };