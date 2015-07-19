module.exports = function (req, res) {
};

exports.reorderUnanswered = function (req, res){
  authenticateUser(req, res, function(){ 
//pushes unanswered questions to front of queue of a certain qSet or question set
    //if (req.params.qSet){
      //if there is a qSet parameter (linked to from dashboard), find first question in qSet's id, move all ids in unanswered session array that are preceeding to end of array

      Question.find({qSet : req.params.qSet},"_id order",{sort:{order: 1}}, function ( err, questions){ 
        if (err) {
          return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 636)")
        }
        console.log(questions) 
        var inQset  = []// a temp array to hold unanswered questions that are within a questionset
         // console.log(req.session.unanswered[i])
          for(j in questions){
            //get index position of question in unanswered array
            var unansIndex = req.session.unanswered.indexOf(String(questions[j]._id));
            //if questionset question in unanswered, store in temp array of matches
            if (unansIndex !=-1){
            inQset.push(req.session.unanswered[unansIndex]);
            //remove matches from unanswered array, will add matched to front later
            req.session.unanswered.splice(unansIndex, 1)
            }
          } //end for j         
        console.log(inQset)
        
        req.session.unanswered = inQset.concat(req.session.unanswered);
        //now that unanswer is reordered continue on to questionnaire
        res.redirect("/questionnaire")
      });//end findOne qSet
      
   // }//if req.params.qSet
   });//end auth
}

exports.questionnaire = function ( req, res ){
  authenticateUser(req, res, function(){  
    /*//deal with if there is get param for skipq or not
    if (req.params.skipq !== undefined && req.params.skipq !== "0"){
      removeFromUnansweredSession(req, req.params.skipq); 
      req.session.skip = true;   
    } */

    var query =  {_id: req.session.unanswered[0]}
    //if conditional question prompted by answer to another question
    if (req.params.nextq && (req.params.nextq != "0" )){
      query = {order: req.params.nextq};
    } 
    //if user has answered and not skipped all questions in db
    else if (req.session.unanswered.length <= 0 && !req.session.skip){
      return res.render('message', { title: 'Questionnaire complete!', user : getUsername(req), message: {text:"Thank you! You have answered all of the survey questions.", msgType: "alert-success"}});
    }
    //if user has skipped some questions
    else if(req.session.unanswered.length <= 0 && req.session.skip) {
      return res.render('go-back-to-skipped', { title: 'Questionnaire complete!', user : getUsername(req), message: {text:"You have reached the end of the survey, but you skipped some questions. You may go back and answer them if you would like.", msgType: "alert-warning"}});
    }
    Question.find(query, function ( err, questions){     
      //if question not found
      if (questions.length <= 0){
        return res.render('message', { title: 'Oops!', user : getUsername(req), message: {text:"It doesn't look like there is a question there yet", msgType: "alert-danger"} });
      }//end if question

      var question = questions[0];
      //console.log(question.storiesPrompt );
      pageOptions = {
        user : getUsername(req),
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
