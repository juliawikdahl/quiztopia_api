const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();
const QUIZZES_TABLE = process.env.QUIZZES_TABLE;

// Hämta alla quiz
module.exports.getQuizzes = async () => {
  const params = {
    TableName: QUIZZES_TABLE,
  };

  try {
    const data = await docClient.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fel vid hämtning av quiz' }),
    };
  }
};

// Skapa ett nytt quiz
module.exports.createQuiz = async (event) => {
  const { userId, quizId, title } = JSON.parse(event.body);

  const params = {
    TableName: QUIZZES_TABLE,
    Item: {
      quizId,
      userId,
      title,
      questions: [], // Initiera med en tom lista för frågor
    },
  };

  try {
    await docClient.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Quiz skapat', quizId }), // Returnera quizId
    };
  } catch (error) {
    console.error('Fel vid skapande av quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fel vid skapande av quiz' }),
    };
  }
};

// Lägg till en fråga i ett quiz
module.exports.addQuestion = async (event) => {
  const { quizId, question, answer, latitude, longitude } = JSON.parse(event.body);

  const params = {
    TableName: QUIZZES_TABLE,
    Key: { quizId },
    UpdateExpression: 'SET questions = list_append(if_not_exists(questions, :empty_list), :question)',
    ExpressionAttributeValues: {
      ':question': [{ question, answer, coordinates: { latitude, longitude } }],
      ':empty_list': [],
    },
  };

  try {
    await docClient.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Fråga tillagd' }),
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
  const { quizId } = event.pathParameters;

  const params = {
    TableName: QUIZZES_TABLE,
    Key: { quizId },
  };

  try {
    const data = await docClient.get(params).promise();
    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Quiz hittades inte' }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(data.Item),
    };
  } catch (error) {
    console.error('Fel vid hämtning av quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fel vid hämtning av quiz' }),
    };
  }
};

// Ta bort ett quiz
module.exports.deleteQuiz = async (event) => {
  const { quizId } = event.pathParameters;

  const params = {
    TableName: QUIZZES_TABLE,
    Key: { quizId },
  };

  try {
    await docClient.delete(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Quiz borttaget' }),
    };
  } catch (error) {
    console.error('Fel vid borttagning av quiz:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Fel vid borttagning av quiz' }),
    };
  }
};
