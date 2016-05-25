function testInterpreter(testcase) {
    var world = new TextWorld(ExampleWorlds[testcase.world]);
    var utterance = testcase.utterance;
    console.log('Testing utterance: "' + utterance + '", in world "' + testcase.world + '"');
    try {
        var parses = Parser.parse(utterance);
        console.log("Found " + parses.length + " parses");
    }
    catch (err) {
        console.log("ERROR: Parsing error!", err);
        return false;
    }
    var correctints = testcase.interpretations.map(function (intp) { return intp.sort().join(" | "); }).sort();
    try {
        var interpretations = Interpreter.interpret(parses, world.currentState).map(function (intp) {
            return intp.interpretation.map(function (literals) { return literals.map(Interpreter.stringifyLiteral).sort().join(" & "); }).sort().join(" | ");
        }).sort();
        console.log(interpretations);
    }
    catch (err) {
        interpretations = [];
    }
    console.log("Correct interpretations:");
    var n = 0;
    interpretations.forEach(function (intp) {
        if (correctints.some(function (i) { return i == intp; })) {
            n++;
            console.log("    (" + n + ") " + intp);
        }
    });
    if (n == correctints.length && n == interpretations.length) {
        if (n == 0) {
            console.log("    There are no interpretations!");
        }
        console.log("Everything is correct!");
        return true;
    }
    if (n == 0) {
        console.log("    No correct interpretations!");
    }
    ;
    if (n < correctints.length) {
        console.log("Missing interpretations:");
        correctints.forEach(function (intp) {
            if (!interpretations.some(function (j) { return j == intp; })) {
                console.log("    (-) " + intp);
            }
        });
    }
    if (n < interpretations.length) {
        console.log("Incorrect interpretations:");
        interpretations.forEach(function (intp) {
            if (!correctints.some(function (i) { return i == intp; })) {
                n++;
                console.log("    (" + n + ") " + intp);
            }
        });
    }
    return false;
}
function runTests(argv) {
    var testcases = [];
    if (argv.length == 0 || argv[0] == "all") {
        testcases = allTestCases;
    }
    else {
        for (var _i = 0, argv_1 = argv; _i < argv_1.length; _i++) {
            var n = argv_1[_i];
            testcases.push(allTestCases[parseInt(n) - 1]);
        }
    }
    var failed = 0;
    for (var i = 0; i < testcases.length; i++) {
        console.log("--------------------------------------------------------------------------------");
        var ok = testInterpreter(testcases[i]);
        if (!ok)
            failed++;
        console.log();
    }
    console.log("--------------------------------------------------------------------------------");
    console.log("Summary statistics");
    console.log("Passed tests: " + (testcases.length - failed));
    console.log("Failed tests: " + failed);
    console.log();
}
try {
    runTests(process.argv.slice(2));
}
catch (err) {
    console.log("ERROR: " + err);
    console.log();
    console.log("Please give at least one argument:");
    console.log("- either a number (1.." + allTestCases.length + ") for each test you want to run,");
    console.log("- or 'all' for running all tests.");
}
