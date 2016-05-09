var Interpreter;
(function (Interpreter) {
    function interpret(parses, currentState) {
        var errors = [];
        var interpretations = [];
        parses.forEach(function (parseresult) {
            try {
                var result = parseresult;
                result.interpretation = interpretCommand(result.parse, currentState);
                interpretations.push(result);
            }
            catch (err) {
                errors.push(err);
            }
        });
        if (interpretations.length) {
            return interpretations;
        }
        else {
            throw errors[0];
        }
    }
    Interpreter.interpret = interpret;
    function stringify(result) {
        return result.interpretation.map(function (literals) {
            return literals.map(function (lit) { return stringifyLiteral(lit); }).join(" & ");
        }).join(" | ");
    }
    Interpreter.stringify = stringify;
    function stringifyLiteral(lit) {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }
    Interpreter.stringifyLiteral = stringifyLiteral;
    function interpretCommand(cmd, state) {
        var objects = Array.prototype.concat.apply([], state.stacks);
        var a = objects[Math.floor(Math.random() * objects.length)];
        var b = objects[Math.floor(Math.random() * objects.length)];
        var interpretation = [[
                { polarity: true, relation: "ontop", args: [a, "floor"] },
                { polarity: true, relation: "holding", args: [b] }
            ]];
        console.log(cmd);
        console.log(state);
        return interpretation;
    }
    function findEntityID(node, state) {
        if (node.entity && node.relation) {
            var entity = findEntityID(node.entity, state);
            if (node.relation == "leftof") {
                var distanceFromLeftAllowed = state.stacks.length - 1;
                for (var i = distanceFromLeftAllowed; i >= 0; i--) {
                    for (var j = 0; j < state.stacks[i].length; j++) {
                        if (entity.indexOf(state.stacks[i][j]) > -1) {
                            distanceFromLeftAllowed = i;
                        }
                    }
                }
                var tmp = [];
                for (var i = 0; i < distanceFromLeftAllowed; i++) {
                    for (var j = 0; j < state.stacks[i].length; j++) {
                        tmp.push(state.stacks[i][j]);
                    }
                }
                return tmp;
            }
            else if (node.relation == "rightof") {
                var distanceFromLeftAllowed = 0;
                for (var i = 0; i < state.stacks.length; i++) {
                    for (var j = 0; j < state.stacks[i].length; j++) {
                        if (entity.indexOf(state.stacks[i][j]) > -1) {
                            distanceFromLeftAllowed = i;
                        }
                    }
                }
                var tmp = [];
                for (var i = distanceFromLeftAllowed; i < state.stacks.length; i++) {
                    for (var j = 0; j < state.stacks[i].length; j++) {
                        tmp.push(state.stacks[i][j]);
                    }
                }
                return tmp;
            }
            else if (node.relation == "inside") {
                var tmp = [];
                for (var i = 0; i < entity.length; i++) {
                    for (var key in state.objects) {
                        if (key == entity[i]) {
                            if (state.objects[key].form != "box") {
                                return tmp;
                            }
                        }
                    }
                }
                for (var i = 0; i < state.stacks.length; i++) {
                    for (var j = 0; j < state.stacks[i].length; j++) {
                        if (entity.indexOf(state.stacks[i][j]) > -1) {
                            if (state.stacks[i][j + 1]) {
                                tmp.push(state.stacks[i][j + 1]);
                                break;
                            }
                        }
                    }
                }
            }
            else if (node.relation == "ontop") {
                var tmp = [];
                if (entity.length != 1) {
                    return tmp;
                }
                for (var i = 0; i < state.stacks.length; i++) {
                    for (var j = 0; j < state.stacks[i].length; j++) {
                        if (entity.indexOf(state.stacks[i][j]) > -1) {
                            if (state.stacks[i][j + 1]) {
                                tmp.push(state.stacks[i][j + 1]);
                            }
                        }
                    }
                }
                return tmp;
            }
            else if (node.realtion == "under") {
                var tmp = [];
                for (var i = 0; i < state.stacks.length; i++) {
                    var count = 0;
                    var nbrOfEntities = entity.length;
                    for (var j = state.stacks[i].length - 1; j >= 0; j--) {
                        if (nbrOfEntities == count) {
                            tmp.push(state.stacks[i][j]);
                        }
                        else {
                            if (entity.indexOf(state.stacks[i][j]) > -1) {
                                count = count + 1;
                            }
                        }
                    }
                }
                return tmp;
            }
            else if (node.relation == "beside") {
                var tmp = [];
                var columnsWithEntities = [];
                for (var i = 0; i < state.stacks.length; i++) {
                    for (var j = 0; j < state.stacks[i].length; j++) {
                        if (entity.indexOf(state.stacks[i][j]) > -1) {
                            columnsWithEntities.push(i);
                            break;
                        }
                    }
                }
                for (var i = 0; i < state.stacks.length; i++) {
                    if (columnsWithEntities.indexOf(i) >= 0) {
                        for (var j = 0; j < state.stacks[i].length; j++) {
                            tmp.push(state.stacks[i][j]);
                        }
                    }
                }
                return tmp;
            }
            else if (node.relation == "above") {
                var tmp = [];
                for (var i = 0; i < state.stacks.length; i++) {
                    var count = 0;
                    var nbrOfEntities = entity.length;
                    for (var j = 0; j < state.stacks[i].length; j++) {
                        if (nbrOfEntities == count) {
                            tmp.push(state.stacks[i][j]);
                        }
                        else {
                            if (entity.indexOf(state.stacks[i][j]) > -1) {
                                count = count + 1;
                            }
                        }
                    }
                }
                return tmp;
            }
        }
        if (node.quantifier && node.object) {
            if (node.quantifier == "any" || node.quantifier == "the") {
                var tmp = [];
                tmp.push(findEntityID(node.object, state)[0]);
                return tmp;
            }
            else if (node.quantifier == "all") {
                return findEntityID(node.object, state);
            }
        }
        if (node.location && node.object) {
            return [];
        }
        if (node.form) {
            var results = [];
            for (var key in state.objects) {
                if (state.objects[key].color == node.color &&
                    state.objects[key].form == node.form &&
                    state.objects[key].size == node.size) {
                    results.push(key);
                    return results;
                }
            }
            return [];
        }
        return [];
    }
})(Interpreter || (Interpreter = {}));
