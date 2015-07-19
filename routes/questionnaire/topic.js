var show = require('../../lib/show.js');
var Question = require('../../models/question.js');

module.exports = function (req, res) {
  if (!req.user) return show.err(req, res, 'Please log in.',
    'You need to be authenticated to fill out a questionnaire.');

  Question.find(
    { qSet : req.params.topic },
    '_id order',
    { sort: { order: 1 }
  }, onqs);
  
  function onqs (err, questions) {
    if (err) return show.err(req, res, 'Oops', err);
    if (questions.length === 0) {
      return res.render('questionnaire/complete', {
        title: 'questionnaire complete',
        user: req.user && req.user.username,
        topic: req.params.topic
      })
    }
    var question = questions[0];
    res.render('questionnaire', {
      user: req.user && req.user.username,
      title: 'Questionnaire',
      qSet: question.qSet,
      question: question.question, 
      label: question.label,
      qType: question.qType,
      qid: question._id,
      numUnans: req.session.unanswered.length,
      storiesPrompt:  question.storiesPrompt       
    });
  }
};
    
    /*
    //if user has answered and not skipped all questions in db
    else if (req.session.unanswered.length <= 0 && !req.session.skip){
      return res.render('message', { title: 'Questionnaire complete!', user : req.user, message: {text:"Thank you! You have answered all of the survey questions.", msgType: "alert-success"}});
    }
    //if user has skipped some questions
    else if(req.session.unanswered.length <= 0 && req.session.skip) {
      return res.render('go-back-to-skipped', { title: 'Questionnaire complete!', user : req.user, message: {text:"You have reached the end of the survey, but you skipped some questions. You may go back and answer them if you would like.", msgType: "alert-warning"}});
    }
    Question.find(query, function (err, questions){     
      //if question not found
      if (questions.length <= 0){
        return res.render('message', { title: 'Oops!', user : req.user, message: {text:"It doesn't look like there is a question there yet", msgType: "alert-danger"} });
      }//end if question

      var question = questions[0];
      //console.log(question.storiesPrompt );
      pageOptions = {
        user : req.user,
        title: 'Questionnaire',
        qSet: question.qSet,
        question: question.question, 
        label: question.label,
        qType: question.qType,
        qid: question._id,
        numUnans: req.session.unanswered.length,
        storiesPrompt:  question.storiesPrompt       
      }
      //append suggested answers if they exist (mongoose creates empty array it seems even if query returns nothing for answers key)
      //if (typeof question.answers !== 'undefined' && question.answers.length > 0){
        pageOptions['answers']= question.answers;
         
      //}
      //if autocomplete info exists, overwrite answers to that
      //console.log(encodeURIComponent(question.autocomplete))
      if(typeof question.autocomplete !== 'undefined' && question.autocomplete.length > 0){
      //console.log("autocomplete")
        pageOptions['answers']= encodeURIComponent(question.autocomplete);
      }
      //append validation logic if present
      if (typeof question.validation !== 'undefined'){
          pageOptions['validate']= question.validation;         
      }
      else{
        pageOptions['validate']= null;
      }
      //append validation mesage
      if (typeof question.valMsg !== 'undefined'){
          pageOptions['valMsg']= question.valMsg;         
      }
      else{
        pageOptions['valMsg']= null;
      }
      //append input placeholder
      if (typeof question.placeholder !== 'undefined'){
          //console.log("there"); 
          pageOptions['placeholder']= question.placeholder;         
      }
      else{
        pageOptions['placeholder']= null;
      }      
      //console.log(pageOptions);
      res.render( 'questionnaire', pageOptions);
    });
  });//end auth user
};
*/
