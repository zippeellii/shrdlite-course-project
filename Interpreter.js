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
        console.log(cmd);
        console.log(state);
        console.log("________");
        var entities = findEntityID(cmd.entity.object, state);
        console.log('Found number entities: ' + entities);
        console.log("________");
        var interpretation = [];
        if (cmd.location) {
            console.log('Location found');
            var locationEntities = findEntityID(cmd.location.entity, state);
            if (cmd.location.relation == 'inside') {
                for (var i = 0; i < locationEntities.length; i++) {
                    for (var j = 0; j < entities.length; j++) {
                        if (checkBallInBox(state.objects[entities[j]], state.objects[locationEntities[i]])) {
                            interpretation.push([{ polarity: true, relation: "inside", args: [entities[j], locationEntities[i]] }]);
                        }
                    }
                }
            }
            if (cmd.location.relation == 'ontop') {
                for (var i = 0; i < entities.length; i++) {
                    for (var j = 0; j < locationEntities.length; j++) {
                        if (state.objects[entities[i]].form != 'ball') {
                            interpretation.push([{ polarity: true, relation: "ontop", args: [entities[i], locationEntities[j]] }]);
                        }
                    }
                }
            }
            console.log('Location entities: ' + locationEntities);
        }
        else {
            for (var i = 0; i < entities.length; i++) {
                interpretation.push([{ polarity: true, relation: "holding", args: [entities[i]] }]);
            }
        }
        console.log("Interpretations: " + interpretation);
        if (interpretation.length == 0) {
            return undefined;
        }
        return interpretation;
    }
    function checkOnTopOf(object1, object2, state) {
        var objects = state.objects;
        if (objects[object1].form == 'ball' && objects[object2].form != 'box') {
            return false;
        }
        if (objects[object2].form == 'ball') {
            return false;
        }
        if (objects[object1].size == 'large' && objects[object2].size == 'small') {
            return false;
        }
        if (objects[object2].form == 'box') {
            if (objects[object1].form == 'pyramid' || objects[object1].form == 'plank' || objects[object1].form == 'box') {
                if (objects[object2].size == 'large' && objects[object2].size == 'large' || objects[object2].size == 'small') {
                    return false;
                }
            }
        }
        return true;
    }
    function checkAbove(object1, object2, state) {
        return checkOnTopOf(object1, object2, state);
    }
    function checkUnder(object1, object2, state) {
        return checkAbove(object2, object1, state);
    }
    function checkBeside(object1, object2, state) {
        return true;
    }
    function checkLeftOf(object1, object2, state) {
        return !(state.stacks[0].indexOf(object2) == -1);
    }
    function checkRightOf(object1, object2, state) {
        return !(state.stacks[state.stacks.length].indexOf(object2));
    }
    function checkBallInBox(ball, box) {
        if (ball.size == 'large' && box.size != 'large' || ball.size == 'small' && box.size == 'tiny' || ball.size == 'tiny' && box.size == 'tiny') {
            return false;
        }
        return true;
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
                var tmp = [];
                for (var k = 0; k < entity.length; k++) {
                    var innerTmp = [];
                    var distanceFromLeftAllowed = state.stacks.length - 1;
                    for (var i = distanceFromLeftAllowed; i >= 0; i--) {
                        for (var j = 0; j < state.stacks[i].length; j++) {
                            if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                                distanceFromLeftAllowed = i;
                            }
                        }
                    }
                    for (var i = 0; i < distanceFromLeftAllowed; i++) {
                        for (var j = 0; j < state.stacks[i].length; j++) {
                            innerTmp.push(state.stacks[i][j]);
                        }
                    }
                    tmp.push(innerTmp);
                }
                return tmp;
            }
            else if (node.relation == "rightof") {
                console.log("- rightof");
                var tmp = [];
                for (var k = 0; k < entity.length; k++) {
                    var innerTmp = [];
                    var distanceFromLeftAllowed = 0;
                    for (var i = 0; i < state.stacks.length; i++) {
                        for (var j = 0; j < state.stacks[i].length; j++) {
                            if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                                distanceFromLeftAllowed = i;
                            }
                        }
                    }
                    for (var i = distanceFromLeftAllowed; i < state.stacks.length; i++) {
                        for (var j = 0; j < state.stacks[i].length; j++) {
                            innerTmp.push(state.stacks[i][j]);
                        }
                    }
                    tmp.push(innerTmp);
                }
                return tmp;
            }
            else if (node.relation == "inside") {
                console.log("- inside");
                var tmp = [];
                for (var k = 0; k < entity.length; k++) {
                    var innerTmp = [];
                    for (var i = 0; i < entity[k].length; i++) {
                        for (var key in state.objects) {
                            if (key == entity[k][i]) {
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
                                if (checkOnTopOf(state.stacks[i][j], boxFound, state)) {
                                    innerTmp.push(state.stacks[i][j]);
                                }
                                boxFound = "";
                            }
                            else {
                                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                                    boxFound = state.stacks[i][j];
                                }
                            }
                        }
                    }
                    tmp.push(innerTmp);
                }
                return tmp;
            }
            else if (node.relation == "ontop") {
                console.log("- ontop");
                var tmp = [];
                for (var k = 0; k < entity.length; k++) {
                    var innerTmp = [];
                    if (entity[k].length != 1) {
                        continue;
                    }
                    for (var i = 0; i < state.stacks.length; i++) {
                        for (var j = 0; j < state.stacks[i].length; j++) {
                            if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                                if (state.stacks[i][j + 1]) {
                                    innerTmp.push(state.stacks[i][j + 1]);
                                }
                            }
                        }
                    }
                    tmp.push(innerTmp);
                }
                return tmp;
            }
            else if (node.realtion == "under") {
                console.log("- under");
                for (var k = 0; k < entity.length; k++) {
                    var innerTmp = [];
                    for (var i = 0; i < state.stacks.length; i++) {
                        var count = 0;
                        var nbrOfEntities = entity[k].length;
                        for (var j = state.stacks[i].length - 1; j >= 0; j--) {
                            if (nbrOfEntities == count) {
                                innerTmp.push(state.stacks[i][j]);
                            }
                            else {
                                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                                    count = count + 1;
                                }
                            }
                        }
                    }
                    tmp.push(innerTmp);
                }
                return tmp;
            }
            else if (node.relation == "beside") {
                console.log("- beside");
                var tmp = [];
                for (var k = 0; k < entity.length; k++) {
                    var innerTmp = [];
                    var columnsWithEntities = [];
                    for (var i = 0; i < state.stacks.length; i++) {
                        for (var j = 0; j < state.stacks[i].length; j++) {
                            if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                                columnsWithEntities.push(i);
                                break;
                            }
                        }
                    }
                    for (var i = 0; i < state.stacks.length; i++) {
                        if (columnsWithEntities.indexOf(i) >= 0) {
                            for (var j = 0; j < state.stacks[i].length; j++) {
                                innerTmp.push(state.stacks[i][j]);
                            }
                        }
                    }
                    tmp.push(innerTmp);
                }
                return tmp;
            }
            else if (node.relation == "above") {
                console.log("- above");
                var tmp = [];
                for (var k = 0; k < entity.length; k++) {
                    var innerTmp = [];
                    for (var i = 0; i < state.stacks.length; i++) {
                        var count = 0;
                        var nbrOfEntities = entity[k].length;
                        for (var j = 0; j < state.stacks[i].length; j++) {
                            if (nbrOfEntities == count) {
                                innerTmp.push(state.stacks[i][j]);
                            }
                            else {
                                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                                    count = count + 1;
                                }
                            }
                        }
                    }
                    tmp.push(innerTmp);
                }
                return tmp;
            }
        }
        if (node.quantifier && node.object) {
            console.log("entity");
            var entity = findEntityID(node.object, state);
            if (node.quantifier == "the") {
                if (entity.length == 1 && entity[0].length == 1) {
                    return entity;
                }
                else {
                    return [];
                }
            }
            else if (node.quantifier == "any") {
                console.log("- any/the");
                var tmp = [];
                for (var i = 0; i < entity.length; i++) {
                    for (var j = 0; j < entity[i].length; j++) {
                        var innerTmp = [];
                        innerTmp.push(entity[i][j]);
                        tmp.push(innerTmp);
                    }
                }
            }
            else if (node.quantifier == "all") {
                console.log("- all");
                return entity;
            }
        }
        if (node.location && node.object) {
            console.log("complex object");
            return [];
        }
        var tmp = [];
        tmp.push(findObject(node, state));
        return tmp;
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
