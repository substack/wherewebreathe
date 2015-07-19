var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;
var Question = require('../models/question.js');
var Answer = require('../models/answer.js');
var authenticateUser = require('./authUser').authUser;
var getUsername = require('./authUser').getUsername
var User = require('../models/user.js');
var StoryPrompt = require('../models/story_prompt.js');
var Story = require('../models/story.js');
var generateUnanswered = require('../lib/generate_unanswered.js');
var csv = require('express-csv')


function removeFromUnansweredSession(req, qid, cb){
  var temp = req.session.unanswered;
  index = temp.indexOf(qid);
  //if qid found in unanswered, remove it
  if (index !== -1){
    temp.splice(index, 1)
    req.session.unanswered = temp;   
  }
  if(cb){
    cb();
  }
}

function getDashStats(req, cb){

  var topics = [{_id: "Household",    title:'Household',    questions: 0, answers: 0, stories: 0 },
                {_id: "Symptoms",     title:'Symptoms',     questions: 0, answers: 0, stories: 0 },
                {_id: "Mitigation",   title:'Mitigation',   questions: 0, answers: 0, stories: 0 },
                {_id: "Other",        title:'Indicators',   questions: 0, answers: 0, stories: 0 },
                {_id: "Demographics", title:'Demographics', questions: 0, answers: 0, stories: 0 }]

  Answer.aggregate([
    {$match: {uid: req.user._id}},
    { $group: {
        _id: '$qSet', 
        count: {$sum: 1}
    }}
  ], function(err, results){ 
    if (err){
        return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 628)")
    } //end if err
    if (!results) {
      return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 629)")
    } 
    for (i in results) {
      for (t in topics) {
        if (topics[t]._id == results[i]._id) topics[t].answers = results[i].count
      }
    }

    Question.aggregate([
      { $match: {}},
      { $group: {
        _id: '$qSet', 
        count: {$sum: 1}
      }}
    ], function(err, questions){ 
      if (err){
          return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 630)")
      } //end if err
      if (!questions) {
          return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 631)")
      } 
      for (i in questions) {
        for (t in topics) {
          if (topics[t]._id == questions[i]._id) topics[t].questions = questions[i].count
        }
      }
 
      Story.aggregate([
        {$match: {}},
        { $group: {
            _id: '$qSet', 
            count: {$sum: 1}
        }}
      ], function(err, stories){ 
        if (err){
            return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 632)")
        } //end if err
        if (!stories) {
            //return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 633)")
        } 
        for (i in stories) {
          for (t in topics) {
            if (topics[t]._id == stories[i]._id) topics[t].stories = stories[i].count
          }
        }

console.log(topics)
      
        var options = { 
          title: 'Home', 
          user : getUsername(req), 
          topics: topics
        }
        return cb(options);  
      });  //end stories agg   
    });
  }); 
}

exports.dashboard = function(req, res){
  authenticateUser(req, res, function(){ 
    getDashStats(req, function(options){
      res.render('dashboard', options);
    });  
  });
};

exports.checkStoryExists = function(req, res){
  //authenticateUser(req, res, function(){ 
  //check if user has already entered a story for a qSet
  console.log(req.params.qSet+" : "+req.user._id);
    Story.findOne({qSet: req.params.qSet, uid: req.user._id}, function (err, story){
      if (err){
        return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 627)")
      } //end if err
      var response;
      console.log(story);
      if (story) {
        response = true;
      }
      else{
        response = false;
      } 
      res.send(200, response);
    }) ;//end find
 //});// end auth user
};

exports.skipQ = function(req, res){
  authenticateUser(req, res, function(){ 
    if (req.params.skipq !== undefined && req.params.skipq !== "0"){
      removeFromUnansweredSession(req, req.params.skipq,
        function(){
          //flag that a question has been skipped
          req.session.skip = true;  
          res.send(200);
        }
      );        
    } 
  });
};

exports.storiesPrompt = function(req, res){
  req.session.returnTo = req.path;
  authenticateUser(req, res, function(){ 
      StoryPrompt.findOne({qSet: req.params.qSet}, function ( err, prompt){
        if (err){
          return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 624)")
        } //end if err
        if (!prompt) {
          return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 625)")
        } 
        console.log(prompt)
        var options = { title: 'Tell your story', user : getUsername(req), heading: prompt.heading, subheading: prompt.subheading, seedQuestions: prompt.seedQuestions, qSet: req.params.qSet}
        options["returnTo"] = req.params.returnTo||"";
        res.render('stories-prompt', options); 
      });   //end find    
  });
};

exports.saveStory = function(req, res){
  authenticateUser(req, res, function(){ 
  var story = new Story({
    uid: req.user._id, 
    uname: req.user.username,
    qSet: req.body.qSet,
    story: req.body.story,
    comments: []
  }); 
  story.save( function(err, data){
    if (err) {
      return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 626)")     
    }    
    res.send(200)
  })//end story save
  });//end auth user
};

exports.fullstory = function(req, res){
  authenticateUser(req, res, function(){ 
    Story.findOne({_id: req.params._id},'uname qSet story comments _id qSet', function (err, story){
      if (err){
        return res.render('message', { title: 'Oops!', user : getUsername(req), message: {text:"Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 637)", msgType: "alert-danger"} });
      } //end if err
      if(!story){
        console.log("fdsfdsnull");
       return res.render('message', { title: 'Oops!', user : getUsername(req), message: {text:"There doesnt appear to be a story here", msgType: "alert-danger"} });
      }
      else{
        var options = { 
          title: story.qSet + " Stories", 
          user : getUsername(req),
          _id: story._id,
          story: story.story, 
          storyUname: story.uname,
          comments: story.comments        
        }
        console.log(options)
        res.render('fullstory', options);
      }
    });//end story.findOne
  });
}//end fullstory

exports.comment = function(req, res){
  if(!req.user){
  return res.send(400, "It looks like you have been logged out. Please log in again to submit your comment");
  }
  var comment = req.body.comment;
  Story.findByIdAndUpdate(req.body._id, { $push: { comments: {
    uId: req.user._id,
    uname: req.user.username,
    comment: req.body.comment.substring(0,5000)
  } }}, function (err, results) {
  if (err){
    return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 638)") 
  }
  if(!results){
   return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 639)") 
  }
  else{
  res.send(200)
  }
  });//end find by ID and update
};

exports.index = function(req, res){
  //if user not logged in send to index, else send to dashboard
  if (!req.user){
    req.session.returnTo = req.path;
    res.render('index', { title: 'Home', user : getUsername(req)});
  }
  else{
    res.redirect('/dashboard');
  }
};

exports.welcome = function(req, res){
  //authenticateUser(req, res, function(){ 
  //res.render('welcome', { title: 'Home', user : getUsername(req), tour: 'yes'});
  //});
  authenticateUser(req, res, function(){ 
  console.log("weloer");
    getDashStats(req, function(options){
    console.log("gsd")
      options['tour'] = "yes";
      console.log(options);
      res.render('welcome', options);
    });  
  });
};

exports.about = function(req, res){
  req.session.returnTo = req.path;
  res.render('about', { title: 'About Where We Breathe', user : getUsername(req)});
};

exports.knowledgebase = function(req, res){
  req.session.returnTo = req.path;
  res.render('knowledge-base', { title: 'Knowledge base', user : getUsername(req)});
};

exports.vinhud = function(req, res){
  req.session.returnTo = req.path;
  res.render('vinhud', { title: 'Am I looking for a VIN or a HUD number?', user : getUsername(req)});
};

exports.goBackSkipped = function(req, res){
  generateUnanswered(req, function(){   
    res.redirect('/questionnaire');
  });//end gen unanswered
};

exports.narratives = function(req, res){
  authenticateUser(req, res, function(){ 
  var qSet = req.params.qSet;
  Story.find({qSet: qSet},'uname story comments _id',{sort:{_id: -1}}, function ( err, stories){
    if (err){
      return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 620)")
    } //end if err
    if (!stories) {
      return res.send(200, "no stories")
    }  //end if no results 
    var modStories = []//for some reason I cant fully edit stories, maybe its a Mongoose thing?
    for (i in stories){
    console.log(stories[i].comments.length)
      var obj = {};
      obj["comments"] = stories[i].comments.length;
      obj["uname"] = stories[i].uname;
      obj["_id"] = stories[i]._id;
      if(stories[i].story.length >50){
        obj["story"] = stories[i].story.substring(0,50)+"...";
      }
      else{
        obj["story"] = stories[i].story;
      }
      modStories.push(obj);
    }
    var options = { title: 'Forums', user : getUsername(req), stories: modStories, qSet: qSet}
    options["returnTo"] = req.params.returnTo||null;

    console.log(options)
    res.render('narratives', options); 
    //res.send(200, modStories);
  });//end stories find
  })//end auth
  //authenticateUser(req, res, function(){ 
  //  res.render('narratives', { title: 'Forums', user : getUsername(req)});
  //});
};

exports.narrativesData = function(req, res){
  authenticateUser(req, res, function(){ 
    var qSet = req.body.qSet
    Question.find({qSet: qSet},'_id qSet question graphType order',{sort:{order: 1}},  function ( err, questions){
      if (err){
        return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 620)")
      } //end if err
      if (!questions) {
        return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 621)")
      }  
      //console.log(questions);
    //store cookie on current question order. 
        //purpose: determine previous, next links. 
        //side effect: keeps track of last graph user saw, so when return to forum page it is the same as it was left in terms of graphs shown.
    //console.log("order: "+questions[0].order);
      if(!req.session.order){
        req.session.order = {};
      }
      //if this qSet doesnt have an order set for it, set it to the first q in the qset
      if(!req.session.order[qSet]){
        req.session.order[qSet] = questions[0].order;
      }
     //control if next or previous question hrefs are shown
      var next = true; 
      var previous = false;
      //if user clicks previous or next question (value will either be 1 or -1)
      if(req.body.progression){
        req.session.order[qSet] += Number(req.body.progression);      
      }
      console.log(req.session.order)     
      for (q in questions){
        if(questions[q].order == req.session.order[qSet]){
          var qid = questions[q]._id
          var question = questions[q].question
          var graphType = questions[q].graphType
          if(q !=0){previous = true}
          if(q == questions.length-1){next = false}
        }
      }
     // console.log("previous: "+previous+", next: "+next);
      //});///does this line do anything or should we axe it? commented out on Sep 23
      //console.log(qid+" : QID ")
      Answer.aggregate([
        {$match: { qid: qid}},
        { $group: {
            _id: '$a', 
            count: {$sum: 1}
        }}
      ], function(err, results){ 
      if (err){
        return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 634)")
      } //end if err
      if (!results) {
        return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 635)")}
        console.log(results)
      //loop through results and append colour
      //palett inspired by http://www.colourlovers.com/palette/1663477/A_Thousand_Rainbows
      var otherCount = 0
      var modifiedResults = []
      //var palette = ['#F2D43F', '#492D61']
      for (i in results){
        //if other: make count
        var object = {}
        if(new RegExp("Other:").test(results[i]._id)){
         otherCount += 1;         
        }
        //if not 'other:...' add to results 
        else{
          object._id = results[i]._id;
          object.count = results[i].count;
          
          if (results[i]._id == "No, never" || results[i]._id == "No"){
            object.color = "#D1026C";        
          }
          else if (results[i]._id == "Yes, often (every week)" || results[i]._id == "Yes"){
            object.color = "#61C155";        
          }
          else if (results[i]._id == "Yes, sometimes"){
            object.color = "#048091";        
          }
          modifiedResults.push(object);
        }
      }
       //push other on to modifiedResults if exists
        if (otherCount > 0){
          modifiedResults.push({_id: "Other", color: "#C0C0C0", count: otherCount})
        }
      if(results.length<=0){
      console.log(results.length)
        var answers = "no data"
      }
      else{
        answers = modifiedResults
      }
      response = {
        question: question,
        graphType: graphType,
        answers: answers,
        previous: previous,
        next: next  
      }
      
      res.send (200, response)
      });
      
    }); //end Question.find
  });//end auth user
}

//append answers into answers collection
exports.answer = function ( req, res ){
  //make sure user logged in 
  if(!req.user){
    return res.send(400, "It looks like you have been logged out. Please log in again to submit your answer")
  }
  var qid = req.body.qid;
  var uid= req.user._id; 
  var a = req.body.answer;
  var qSet = req.body.qSet //added later so can create summary of answered by qSet on dashboard
  console.log(a);
    if (!a) {
      return res.send(400, "Your answer shouldnt be blank")     
    }
    else{
      //cant trim if undefined
      a = a.trim()
      if(a == ""){
        return res.send(400, "Your answer shouldnt be blank")  
      }
    }
  //check that there already isnt an answer for that question/user combo (redundant, but clean data is awesome!)
  Answer.find({qid: qid, uid: uid}, function(err, existingResults){
    if (err) {
      return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 619)")     
    }
    if(existingResults.length > 0){
      return res.send(400, "Looks like you already answered that question.")
    }
    //check if answer isnt too short or too long, and doesnt have any crazy characters
    // could read specific validation loged from questions table, but probably overkill
    if(! /^[A-Za-z0-9_ .:(),;?&'\/-]{1,50}$/.test(a)){ 
      return res.send(400, "Your answer, '"+a+"', looks either too long or too short, or has characters that arent allowed.") 
    } 
    //no validation arrors, continue on...
    else{
     var ans = new Answer({
        qid: qid,
        uid: uid, 
        a: a,
        qSet: qSet
      });
      ans.save( function(err, data){
        if (err) {
          return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 617)")     
        }
        //append qid to users array of answered questions
        User.findByIdAndUpdate(req.user._id, {$push: {answered: req.body.qid}}, function (err, results) {
          if (err) {
            return res.send(400, "Something went wrong on our side of things. Please try again, or contact us to let us know. (Error ID: 618)")
          }
          //remove question from session array
          removeFromUnansweredSession(req, req.body.qid, function(){
          var msgResponse = "OK";
          if (req.body.nextq){
            msgResponse = req.body.nextq.toString();
            //console.log("nextQ========================"+req.body.nextq);
          }
          //console.log("ANSWEEEEEEEEEEEEEEEEEEEEER");
          res.send(200, msgResponse);
          });
        });//end findby...

      });//end ans.save       
    }
  });
    
}

/**********************************************************************
DATA DOWNLOAD
***********************************************************************/ 
exports.download =  function(req, res) {
  req.session.returnTo = req.path;
  res.render('download', { title: 'Export Where We Breathe Data', user : getUsername(req)});
}  
exports.exportData =  function(req, res) {
req.session.returnTo = req.path;
//this is where it really seems like we should have used a RDBMS... Mongo doesnt *really* join data well, and also js being async doesnt make this app-side join/conversion straightforward. Its probably unlikely that our server will get overloaded with data download requests, so I apologize for the convoluted next bit of code (this is better than starting from scratch with a RDBMS!).
  Question.find({},'question order',{sort:{order: 1}}, function(err, questions){
    if (err) {return res.send(400, "Something went wrong on our side of things. Please try that again, or contact us to let us know. (Error ID: 622)")}

    var csv = [];
    var titles = [];
    
    //create title row for csv
    for(j in questions){
      titles.push(questions[j].question)          
    }//end for loop
    csv.push(titles)

    //get unique users who have answered questions (each user will have a csv row)
    Answer.distinct('uid', function(err, usersAnswered){
      //create function to iterate through each userid to create row/array for csv, but waiting for mongo query to return and the  processing of the results before continuing onto the next iteration (for loops create a mess here)     
      var recursiveLoop = function(i){
        //for each user create a row of answers 
        if(i< usersAnswered.length){
          //find all of the answers form this user
          Answer.find({uid: usersAnswered[i]},'',{sort:{ qid: 1}}, function(err, answers){
            if (err) {return res.send(400, "Something went wrong on our side of things. Please that try again, or contact us to let us know. (Error ID: 623)")}
            //temp array to hold array/row of user's answers in order       
            var userCsvRow = [];
            //for each question, loop through and fill in the userCsvRow array with the answer in the index location that matches the questions index in the title row (j) 
            for(j in questions){
              //default value null
              userCsvRow[j] = '<null>'
              //console.log(questions[j].question);
              for (k in answers){
                if (answers[k].qid.equals(questions[j]._id)){
                  //if the answer's qid matched the question's id, then overwrite the null value at the same index location as the title row for the particular question
                  userCsvRow[j] = answers[k].a
                  //console.log(userCsvRow[j])
                }
                
              }//end for k in answers
            }//end for j in questions
            csv.push(userCsvRow);
            //continue to next user
            i++;
            recursiveLoop(i);
          });//end ans.find        
        }
        else {
          //console.log(csv);
          res.csv(csv)
          return console.log('end'); // exit condition
        }
      }//end recursiveLoop
      
      //start iteration through users to create their answer rows
      recursiveLoop(0);
    });
  });//end Q.find
}

/**********************************************************************
TEST - remove later
***********************************************************************/   
exports.test =  function(req, res) {
  var Chance = require('chance');
  var chance = new Chance();
  var i = 0;
  while(i<=100){
  var candidateName = chance.word({syllables: 3})
  console.log(candidateName);
  i ++;
  }
  
}

