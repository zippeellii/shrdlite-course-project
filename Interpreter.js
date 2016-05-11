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
        var command = cmd.command;
        var entity = cmd.entity;
        var location = cmd.location;
        console.log("Object: " + findObject(cmd.entity.object, state));
        var objects = Array.prototype.concat.apply([], state.stacks);
        var a = objects[Math.floor(Math.random() * objects.length)];
        var b = objects[Math.floor(Math.random() * objects.length)];
        var tast = false;
        for (var obj in state.objects) {
            tast = false;
            for (var id in state.stacks) {
                if (state.stacks[id].indexOf(obj) > -1) {
                    tast = true;
                }
            }
            if (!tast) {
                delete state.objects[obj];
            }
        }
        console.log("________");
        var entities = findEntityID(cmd.entity, state);
        console.log(entities);
        console.log("________");
        var interpretation;
        if (cmd.location) {
            var locationEntities = findEntityID(cmd.location.entity, state);
            console.log("________");
            interpretation = [[
                    { polarity: true, relation: cmd.location.relation, args: [entities[0], locationEntities[0]] }
                ]];
        }
        else {
            interpretation = [[
                    { polarity: true, relation: "holding", args: [entities[0]] }
                ]];
        }
        return interpretation;
    }
    function findObject(object, state) {
        var tmp = [];
        if (object.object == undefined) {
            for (var obj in state.objects) {
                var other = state.objects[obj];
                if (validForm(object, other.form) && validSize(object, other.size) && validColor(object, other.color)) {
                    tmp.push(obj);
                }
            }
        }
        return tmp;
    }
    function validForm(object, worldObject) {
        if (object.form == undefined || object.form == null || object.form == "anyform") {
            return true;
        }
        return object.form == worldObject;
    }
    function validSize(object, worldObject) {
        if (object.size == undefined || object.size == null) {
            return true;
        }
        return object.size == worldObject;
    }
    function validColor(object, worldObject) {
        if (object.color == null || object.color == undefined) {
            return true;
        }
        return object.color == worldObject;
    }
    function findEntityID(node, state) {
        if (node.entity && node.relation) {
            console.log("location");
            var entity = findEntityID(node.entity, state);
            if (node.relation == "leftof") {
                console.log("- leftof");
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
                console.log("- rightof");
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
                console.log("- inside");
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
                    var boxFound = "";
                    for (var j = 0; j < state.stacks[i].length; j++) {
                        var object = state.stacks[i][j];
                        if (boxFound != "") {
                            if (checkOnTopOf(state.stacks[i][j], boxFound)) {
                                tmp.push(state.stacks[i][j]);
                            }
                            boxFound = "";
                        }
                        else {
                            if (entity.indexOf(state.stacks[i][j]) > -1) {
                                boxFound = state.stacks[i][j];
                            }
                        }
                    }
                }
            }
            else if (node.relation == "ontop") {
                console.log("- ontop");
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
                console.log("- under");
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
                console.log("- beside");
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
                console.log("- above");
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
            console.log("entity");
            if (node.quantifier == "any" || node.quantifier == "the") {
                console.log("- any/the");
                var tmp = [];
                tmp.push(findEntityID(node.object, state)[0]);
                return tmp;
            }
            else if (node.quantifier == "all") {
                console.log("- all");
                return findEntityID(node.object, state);
            }
        }
        if (node.location && node.object) {
            console.log("complex object");
            return [];
        }
        return findObject(node, state);
    }
    function getObjectFromID(id, state) {
        for (var key in state.objects) {
            if (key == id) {
                return state.objects[key];
            }
        }
        return undefined;
    }
})(Interpreter || (Interpreter = {}));
