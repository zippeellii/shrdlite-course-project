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
            console.log(interpretations);
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
        removeObjectsNotInStacks(state);
        var entityObjects = getNodeObjects(cmd.entity.object, state);
        var interpretation = [];
        if (cmd.location) {
            var locationObjects = getNodeObjects(cmd.location.entity, state);
            for (var i = 0; i < locationObjects.length; i++) {
                for (var j = 0; j < locationObjects[i].length; j++) {
                    for (var k = 0; k < entityObjects.length; k++) {
                        for (var l = 0; l < entityObjects[k].length; l++) {
                            if (cmd.location.relation == 'inside') {
                                if (checkOnTopOf(entityObjects[k][l], locationObjects[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "inside", args: [entityObjects[k][l], locationObjects[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'above') {
                                if (checkAbove(entityObjects[k][l], locationObjects[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "above", args: [entityObjects[k][l], locationObjects[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'under') {
                                if (checkUnder(entityObjects[k][l], locationObjects[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "under", args: [entityObjects[k][l], locationObjects[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'leftof') {
                                if (checkLeftOf(entityObjects[k][l], locationObjects[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "leftof", args: [entityObjects[k][l], locationObjects[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'rightof') {
                                if (checkRightOf(entityObjects[k][l], locationObjects[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "rightof", args: [entityObjects[k][l], locationObjects[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'beside') {
                                if (checkBeside(entityObjects[k][l], locationObjects[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "beside", args: [entityObjects[k][l], locationObjects[i][j]] }]);
                                }
                            }
                            if (cmd.location.relation == 'ontop') {
                                if (checkOnTopOf(entityObjects[k][l], locationObjects[i][j], state)) {
                                    interpretation.push([{ polarity: true, relation: "ontop", args: [entityObjects[k][l], locationObjects[i][j]] }]);
                                }
                            }
                        }
                    }
                }
            }
        }
        else {
            if (cmd.entity.quantifier == 'any') {
                for (var i = 0; i < entityObjects.length; i++) {
                    for (var j = 0; j < entityObjects[i].length; j++) {
                        interpretation.push([{ polarity: true, relation: "holding", args: [entityObjects[i][j]] }]);
                    }
                }
            }
            else {
                for (var i = 0; i < entityObjects.length; i++) {
                    var conjCommands = [];
                    for (var j = 0; j < entityObjects[i].length; j++) {
                        conjCommands.push({ polarity: true, relation: "holding", args: [entityObjects[i][j]] });
                    }
                    interpretation.push(conjCommands);
                }
            }
        }
        if (interpretation.length == 0) {
            throw new Error('No intepretation found');
        }
        return interpretation;
    }
    function checkOnTopOf(object1, object2, state) {
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
    function getNodeObjects(node, state) {
        if (node.entity && node.relation) {
            return getLocationObjects(node, state);
        }
        if (node.quantifier && node.object) {
            return getEntityObjects(node, state);
        }
        if (node.location && node.object) {
            return getComplexObject(node, state);
        }
        var tmp = [];
        tmp.push(findObject(node, state));
        return tmp;
    }
    function getObjectsLeftOf(entity, state) {
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
            if (innerTmp.length > 0) {
                tmp.push(innerTmp);
            }
        }
        return tmp;
    }
    function getObjectsRightOf(entity, state) {
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
            if (innerTmp.length > 0) {
                tmp.push(innerTmp);
            }
        }
        return tmp;
    }
    function getObjectsInside(entity, state) {
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
            if (innerTmp.length > 0) {
                tmp.push(innerTmp);
            }
        }
        return tmp;
    }
    function getObjectsOntop(entity, state) {
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
            if (innerTmp.length > 0) {
                tmp.push(innerTmp);
            }
        }
        return tmp;
    }
    function getObjectsUnder(entity, state) {
        var tmp = [];
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
            if (innerTmp.length > 0) {
                tmp.push(innerTmp);
            }
        }
        return tmp;
    }
    function getObjectsBeside(entity, state) {
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
            if (innerTmp.length > 0) {
                tmp.push(innerTmp);
            }
        }
        return tmp;
    }
    function getObjectsAbove(entity, state) {
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
            if (innerTmp.length > 0) {
                tmp.push(innerTmp);
            }
        }
        return tmp;
    }
    function getLocationObjects(node, state) {
        var entity = getNodeObjects(node.entity, state);
        if (node.relation == "leftof") {
            return getObjectsLeftOf(entity, state);
        }
        else if (node.relation == "rightof") {
            return getObjectsRightOf(entity, state);
        }
        else if (node.relation == "inside") {
            return getObjectsInside(entity, state);
        }
        else if (node.relation == "ontop") {
            return getObjectsOntop(entity, state);
        }
        else if (node.realtion == "under") {
            return getObjectsUnder(entity, state);
        }
        else if (node.relation == "beside") {
            return getObjectsBeside(entity, state);
        }
        else if (node.relation == "above") {
            return getObjectsAbove(entity, state);
        }
        return [];
    }
    function getEntityObjects(node, state) {
        var entity = getNodeObjects(node.object, state);
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
        return [];
    }
    function getComplexObject(node, state) {
        var objects = getNodeObjects(node.object, state);
        var concatObjects = Array.prototype.concat.apply([], objects);
        var location = getNodeObjects(node.location, state);
        for (var i = 0; i < location.length; i++) {
            for (var j = 0; j < location[i].length; j++) {
                if (concatObjects.indexOf(location[i][j]) == -1) {
                    location[i].splice(j, 1);
                }
            }
        }
        return location;
    }
    function removeObjectsNotInStacks(state) {
        var objectExists = false;
        for (var obj in state.objects) {
            objectExists = false;
            for (var id in state.stacks) {
                if (state.stacks[id].indexOf(obj) > -1) {
                    objectExists = true;
                }
            }
            if (!objectExists) {
                delete state.objects[obj];
            }
        }
    }
})(Interpreter || (Interpreter = {}));
