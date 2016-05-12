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
            var locationEntities = findEntityID(cmd.location.entity, state);
            console.log('Location entities: ' + locationEntities);
            for (var i = 0; i < locationEntities.length; i++) {
                for (var j = 0; j < locationEntities[i].length; j++) {
                    for (var k = 0; k < entities.length; k++) {
                        for (var l = 0; l < entities[k].length; l++) {
                            if (cmd.location.relation == 'inside') {
                                if (checkOnTopOf(entities[k][l], locationEntities[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "inside", args: [entities[k][l], locationEntities[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'above') {
                                if (checkAbove(entities[k][l], locationEntities[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "above", args: [entities[k][l], locationEntities[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'leftof') {
                                if (checkLeftOf(entities[k][l], locationEntities[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "leftof", args: [entities[k][l], locationEntities[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'beside') {
                                if (checkBeside(entities[k][l], locationEntities[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "beside", args: [entities[k][l], locationEntities[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'ontop') {
                                if (checkOnTopOf(entities[k][l], locationEntities[i][j], state)) {
                                    console.log('In ontop, taking location entity: ' + locationEntities[i][j]);
                                    console.log('In ontop, taking entity: ' + entities[k][l]);
                                    interpretation.push([{ polarity: true, relation: "ontop", args: [entities[k][l], locationEntities[i][j]] }]);
                                }
                            }
                        }
                    }
                }
            }
        }
        else {
            if (cmd.entity.quantifier == 'any') {
                for (var i = 0; i < entities.length; i++) {
                    for (var j = 0; j < entities[i].length; j++) {
                        interpretation.push([{ polarity: true, relation: "holding", args: [entities[i][j]] }]);
                    }
                }
            }
            else {
                for (var i = 0; i < entities.length; i++) {
                    var conjCommands = [];
                    for (var j = 0; j < entities[i].length; j++) {
                        console.log('Value of j: ' + j);
                        conjCommands.push({ polarity: true, relation: "holding", args: [entities[i][j]] });
                    }
                    interpretation.push(conjCommands);
                }
            }
        }
        console.log('Stringify literal' + stringifyLiteral(interpretation[0][0]));
        if (interpretation.length == 0) {
            return undefined;
        }
        return interpretation;
    }
    function checkOnTopOf(object1, object2, state) {
        console.log(object1 + " " + object2);
        if (object2 == undefined || object1 == undefined) {
            return false;
        }
        var objects = state.objects;
        if (object2 == 'floor') {
            return true;
        }
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
        for (var i = 0; i < state.stacks.length; i++) {
            if (state.stacks[i].indexOf(object2) != -1) {
                return checkOnTopOf(object1, state.stacks[i][state.stacks[i].length - 1], state);
            }
        }
        return checkOnTopOf(object1, object2, state);
    }
    function checkUnder(object1, object2, state) {
        return checkAbove(object2, object1, state);
    }
    function checkBeside(object1, object2, state) {
        return true;
    }
    function checkLeftOf(object1, object2, state) {
        return object1 != object2;
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
        if (object.form == 'floor') {
            tmp.push('floor');
        }
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
                        if (entity[0][0] == 'floor') {
                            if (state.stacks[i][0]) {
                                innerTmp.push(state.stacks[i][0]);
                            }
                        }
                        else {
                            for (var j = 0; j < state.stacks[i].length; j++) {
                                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                                    if (state.stacks[i][j + 1]) {
                                        innerTmp.push(state.stacks[i][j + 1]);
                                    }
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
                console.log('This is what we get to beside: ' + entity);
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
                            if (i > 0) {
                                for (var j = 0; j < state.stacks[i - 1].length; j++) {
                                    innerTmp.push(state.stacks[i - 1][j]);
                                }
                            }
                            if (i < state.stacks.length - 2) {
                                for (var j = 0; j < state.stacks[i + 1].length; j++) {
                                    innerTmp.push(state.stacks[i + 1][j]);
                                }
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
                return tmp;
            }
            else if (node.quantifier == "all") {
                console.log("- all");
                return entity;
            }
        }
        if (node.location && node.object) {
            var objects = findEntityID(node.object, state);
            var concatObjects = Array.prototype.concat.apply([], objects);
            var location = findEntityID(node.location, state);
            console.log('Concated objects: ' + concatObjects);
            console.log('Location objects: ' + location);
            for (var i = 0; i < location.length; i++) {
                for (var j = 0; j < location[i].length; j++) {
                    if (concatObjects.indexOf(location[i][j]) == -1) {
                        delete location[i][j];
                    }
                }
            }
            console.log("complex object");
            return location;
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
