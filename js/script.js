
//Clipboardjs
var clipboard = new Clipboard('.clip', {
  text: function() {
    return 'https://uniarea.github.io';
}
});

clipboard.on('success', function(e) {
  console.log(e);
});

clipboard.on('error', function(e) {
  console.log(e);
});


$(document).ready(function() {

    //Toggle grades' box when respective checkbox is clicked
    $(".checker").click(function() {
        $(this).next().toggle();
        $(this).next().val('0')
    });

    //Same as above but specific for 2nd phase exams
    $(".checkerPhase2").click(function() {
        $(this).next().toggle();
        $(this).next().val('0');
        $(this).next().next().toggle();
        $(this).next().next().next().toggle();
    });

    //Bootstap's tooltip
    $('[data-toggle="tooltip"]').tooltip();
});


//Calculate a unit's CIF
var calculateUnitInternalScore = function(index) {
    var values = $('input[name^=grade' + index + ']').map(function(idx, elem) {
        return parseInt($(elem).val());
    }).get();
    var sum = values.reduce(function(a,b) {return a+b});
    return Math.round(sum/values.length);
}

//Get exams' values (including checkboxes)
var getUnitExams = function(index) {
    var values = $('input[name^=exam' + index + ']').map(function(idx, elem) {
        //if current value is a number (actually, a string that holds a number), return the value (as a number)
        var currentValue = parseInt($(elem).val());
        if(!isNaN(currentValue))
            return currentValue;

        //if it's not a number, it's a checkox -> get checkbox value
        return $(elem).is(':checked');
    }).get();
    return values;
}

//Calculates grade in each mandatory exam for first and second phase
var getMandatoryExams = function(index){
  var totalExams = getUnitExams(index);

  /* Test made: second phase exam done in year previous to current? Note that
   * there's no need to test for second phase flag because if [3] is set, [1] MUST be set */
  var firstPhase = (totalExams[3] ? Math.max(totalExams[0],totalExams[2]) : totalExams[0]);
  var secondPhase = Math.max(firstPhase, totalExams[2]);

  return [firstPhase, secondPhase];
}

//Calculates CFD for the unit at 'index' - left it for readability purposes
var calculateCFD = function(index) {
    return calculateUnitInternalScore(index);
}

//Calculates all CFDs
var calculateAllCFDs = function() {
    var res = [];
    for(var i = 0; i < 9; i++)
        res.push(calculateCFD(i));
    return res;
}

//Get access values (provas de ingresso)
var getAccessValues = function() {
    var res = [];
    var current = "";

    for(var i = 0; i < 7; i++)
        res.push($('input[name^=access' + i + ']:checked').val());
    return res;
}

//Calculate Internal Final Score - First and Second Phase - FOR SPORT COURSES
var calculateInternalScoresSport = function() {
    var CFDs = calculateAllCFDs();

    var total = 0;

    for(var i = 0; i < 9; i++)
        total += CFDs[i];

    return Math.trunc(total/9*10);
}

//Calculate Internal Final Score - First and Second Phase
var calculateInternalScores = function() {
    var CFDs = calculateAllCFDs();

    var total = 0;

    for(var i = 0; i < 9; i++) {
        if(i != 3) //All but Educação Física
          total += CFDs[i];
    }

    return Math.trunc(total/8*10);
}

var calculateSpecificInternalScoresSports = function(){
  var normalInternalScores = calculateInternalScoresSport();

  var portugueseExams = getMandatoryExams(0);
  var trienalExams = getMandatoryExams(1);
  var bienalIExams = getMandatoryExams(2);
  var bienalIIExams = getMandatoryExams(3);

  var examsAverageFirstPhase = Math.round((portugueseExams[0]+trienalExams[0]+bienalIExams[0]+bienalIIExams[0])/4);
  var examsAverageSecondPhase = Math.round((portugueseExams[1]+trienalExams[1]+bienalIExams[1]+bienalIIExams[1])/4);

  var firstPhase = Math.round(0.7*normalInternalScores+0.3*examsAverageFirstPhase);
  var secondPhase = Math.round(0.7*normalInternalScores+0.3*examsAverageSecondPhase);

  return [firstPhase, secondPhase];
}

var calculateSpecificInternalScores = function(){
  var normalInternalScores = calculateInternalScores();

  var portugueseExams = getMandatoryExams(0);
  var trienalExams = getMandatoryExams(1);
  var bienalIExams = getMandatoryExams(2);
  var bienalIIExams = getMandatoryExams(3);

  var examsAverageFirstPhase = Math.round((portugueseExams[0]+trienalExams[0]+bienalIExams[0]+bienalIIExams[0])/4);
  var examsAverageSecondPhase = Math.round((portugueseExams[1]+trienalExams[1]+bienalIExams[1]+bienalIIExams[1])/4);

  var firstPhase = Math.round(0.7*normalInternalScores+0.3*examsAverageFirstPhase);
  var secondPhase = Math.round(0.7*normalInternalScores+0.3*examsAverageSecondPhase);

  return [firstPhase, secondPhase];
}

//Calculate access exams score
var calculateAccessScores = function() {
    var accessValues = getAccessValues();

    var firstPhase = 0;
    var secondPhase = 0;
    var counter = 0;

    for(var i = 0; i < accessValues.length; i++) {
        var currentExams = getUnitExams(i);

        if(accessValues[i] == 'yes') {
            counter++;
            firstPhase += currentExams[0]; //First Phase Exam
            secondPhase += Math.max(currentExams[0], currentExams[2]); //Max of all exams
        }
    }
    firstPhase = Math.trunc((firstPhase/counter)*10)/10;
    secondPhase = Math.trunc((secondPhase/counter)*10)/10;

    return [firstPhase, secondPhase];
}

//Calculate final score (finally)
var calculateFinalScore = function() {
    var accessExamsWeight = $("#accessPercentage").val() / 100;
    var internalScoreWeight = 1 - accessExamsWeight;

    var accessScores = calculateAccessScores();
    var internalScores = calculateSpecificInternalScores();

    var firstPhase = (accessScores[0] * accessExamsWeight + internalScores[0] * internalScoreWeight).toPrecision(4);
    var secondPhase = (accessScores[1] * accessExamsWeight + internalScores[1] * internalScoreWeight).toPrecision(4);

    return [firstPhase, secondPhase];
}

//Calculate final score for SPORT courses
var calculateFinalScoreSport = function() {
    var accessExamsWeight = $("#accessPercentage").val() / 100;
    var internalScoreWeight = 1 - accessExamsWeight;

    var accessScores = calculateAccessScores();
    var internalScores = calculateSpecificInternalScoresSports();

    var firstPhase = (accessScores[0] * accessExamsWeight + internalScores[0] * internalScoreWeight).toPrecision(4);
    var secondPhase = (accessScores[1] * accessExamsWeight + internalScores[1] * internalScoreWeight).toPrecision(4);

    return [firstPhase, secondPhase];
}

//Verify input
var verifyInput = function() {

    //Units' grades (1-20)
    var units = [];

    //Exams' grades (0-200)
    var exams = [];

    //Access Values (Provas de Ingresso (sim-nao))
    var accessValues = getAccessValues();

    //Get unit's and exams' values
    for(var i = 0; i < 9; i++) {
        units.push($('input[name^=grade' + i + ']').map(function(idx, elem) {
            return parseInt($(elem).val());
        }).get());

        if(i < 7)
          exams.push(getUnitExams(i));
    }

    units = steamrollArray(units).filter(function(val) {
        return val >= 1 && val <= 20 && $.isNumeric(val);
    })

    exams = steamrollArray(exams).filter(function(val) {
        return val >= 0 && val <= 200 && $.isNumeric(val);
    })

    accessValues = accessValues.filter(function(val) {
        return val == 'yes';
    })

    var hasError = false;
    var errors = "";

    // 19 and 14 -> number of input boxes
    if(units.length != 19) {
        hasError = true;
       errors += "<li>Há pelo menos uma nota de disciplina com um valor inválido.</li>";
    }

    if(exams.length != 14) {
        console.log(exams.length);
        hasError = true;
       errors += "<li>Há pelo menos uma nota de exame com um valor inválido.</li>";
    }

    if(accessValues.length == 0) {
        hasError = true;
        errors += "<li>Tens de ter pelo menos uma disciplina marcada com \"Sim\" na coluna de <strong>Provas de Ingresso</strong>.</li>";
    }

    if(hasError) {
        $("#inputErrorText").append(errors);
        $("#inputError").css("display","block");
    }
}

//Display scores on screen
var displayScores = function() {
    //Reset error state
    $("#inputErrorText").empty();
    $("#inputError").css("display","none");

    //Verify input but calculate anyway
    verifyInput();

    var accessExamsWeight = $("#accessPercentage").val();
    var internalScoreWeight = 100 - accessExamsWeight;

    var accessExamsScore = calculateAccessScores();

    var internalScores = calculateSpecificInternalScores();
    var internalScoresSport = calculateSpecificInternalScoresSports();

    var finalScore = calculateFinalScore();
    var finalScoreSport = calculateFinalScoreSport();

    $("#accessExamsWeight").html(accessExamsWeight);
    $("#accessScoreFirstPhase").html(accessExamsScore[0]);
    $("#accessScoreSecondPhase").html(accessExamsScore[1]);

    $(".internalScoreWeight").html(internalScoreWeight);
    $("#internalScoreFirstPhase").html(internalScores[0]);
    $("#internalScoreSecondPhase").html(internalScores[1]);

    $("#finalScoreFirstPhase").html(finalScore[0]);
    $("#finalScoreSecondPhase").html(finalScore[1]);

    //Sports
    $(".internalScoreSportWeight").html(internalScoreWeight);
    $("#internalScoreSportFirstPhase").html(internalScoresSport[0]);
    $("#internalScoreSportSecondPhase").html(internalScoresSport[1]);

    $("#finalScoreSportFirstPhase").html(finalScoreSport[0]);
    $("#finalScoreSportSecondPhase").html(finalScoreSport[1]);

    console.log("Values displayed!");
}

//Save scores to text file
var saveScores = function(){
    var results = "CFDs - Classificações Finais das Disciplinas:\r\n";
    var cfds = calculateAllCFDs();
    var subjects = ["Português", "Filosofia", "Língua Estrangeira", "Educação Física", "Trienal Específica", "Bienal I", "Bienal II", "Anual I", "Anual II"];
    //CFDs
    for(var i = 0; i < subjects.length; i++){
        results += subjects[i] + ": " + cfds[i] + "\r\n";
    }
    results += "\nClassificação Final com Efeito de Prosseguimento de Estudos (CFCEPE):\r\n";
    //Final internal score
    var internalscores = calculateSpecificInternalScores();
    var internalscoresport = calculateSpecificInternalScoresSports();
    for(var j = 0; j < 2; j++){
        results += j+1 + "ª Fase:\r\n";
        results += "Cursos Área Desporto: " + internalscoresport[j] + "\r\n";
        results += "Cursos Restantes Áreas: " + internalscores[j] + "\r\n\r\n";
    }
    //Access scores
    var accesscores = calculateAccessScores();
    results += "Média da(s) prova(s) de ingresso:\r\n";
    results += "1ª Fase: " + accesscores[0] + " | 2ª Fase: " + accesscores[1] + "\r\n\r\n";
    //Final scores
    var finalscores = calculateFinalScore();
    var finalscoresport = calculateFinalScoreSport();
    results += "--------------------\r\n";
    results += "Nota de Candidatura:\r\n";
    results += "--------------------\r\n";
    for(var k = 0; k < 2; k++){
        results += k+1 + "ª Fase:\r\n";
        results += "Cursos Área Desporto: " + finalscores[k] + "\r\n";
        results += "Cursos Restantes Áreas: " + finalscoresport[k] + "\r\n\r\n";
    }
    results += "Obrigado por utilizares o nosso simulador!\r\nhttps://uniarea.github.io/";
    //Actually save data in resultados.txt
    var blob = new Blob([results], {type: "text/plain;charset=utf-8"});
    saveAs(blob, "resultados.txt");
}

//Auxiliary functions to transform matrix-like structures into array
function steamrollAux(arr){
  for(var i = 0; i < arr.length; i++){
    if(!Array.isArray(arr[i]))
      result.push(arr[i]);
    else
      steamrollAux(arr[i]);
  }
}

function steamrollArray(arr) {
  result = [];
  for(var i = 0; i < arr.length; i++){
    if(!Array.isArray(arr[i]))
      result.push(arr[i]);
    else
      steamrollAux(arr[i]);
  }
  return result;
}
