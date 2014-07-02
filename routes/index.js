var mongoose = require( 'mongoose' );
var Question = mongoose.model( 'Question' );
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};
//exports.test = function(req, res){
//  res.render('test', { title: 'teest', cats: ['a', 'b']});
//};
//exports.questionnaire = function(req, res){
//  res.render('questionnaire', { title: 'Questions'});
//};
// query db for all todo items
exports.questionnaire = function ( req, res ){
            Question.find(function ( err, questions){
              console.log(questions[0].answers);
              res.render( 'questionnaire', {
                title : 'Cats Test',
                question: questions[0].question, 
                instruction: questions[0].label,
                answers: questions[0].answers            
              });
              });

            

  
};
//exports.questionnaire_cat = function ( req, res ){
//  Cat.aggregate([
//        { $group: {
//            _id: '$breed',
//            weightAvg: { $avg: '$weight'}
//        }}
//    ], function (err, aveWeight) {
//        if (err) {
//            console.error(err);
//        } else {
//            console.log(aveWeight);
 //           Cat.find( function ( err, cats){
///              //console.log(cats);
//              res.render( 'questionnaire_cat', {
//                title : 'Cats Test',
//                cats : cats,
//                aveWeight : aveWeight
//                
//              });
//            });
//        }
//    }
//);
  
//};

//test write to db
//exports.create = function ( req, res ){
///  new Cat({
//    name    : req.body.txtName,
//    weight: req.body.numWeight, 
//    breed: req.body.txtBreed
//  }).save( function( err, todo, count ){
//    res.redirect( '/questionnaire_cat' );
//  });
//};
