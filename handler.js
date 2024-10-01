'use strict';

const auth = require('./auth');
const quiz = require('./quiz');
require('dotenv').config();


module.exports.signup = auth.signup;
module.exports.login = auth.login;
module.exports.getQuizzes = quiz.getQuizzes;
module.exports.createQuiz = quiz.createQuiz;
module.exports.addQuestion = quiz.addQuestion;
module.exports.getQuiz = quiz.getQuiz;
module.exports.deleteQuiz = quiz.deleteQuiz;
