const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const docClient = new AWS.DynamoDB.DocumentClient();
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;

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
