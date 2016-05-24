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
        var physicFunctionsMap = new collections.Dictionary();
        physicFunctionsMap.setValue('inside', checkOnTopOf);
        physicFunctionsMap.setValue('above', checkAbove);
        physicFunctionsMap.setValue('under', checkUnder);
        physicFunctionsMap.setValue('leftof', checkLeftOf);
        physicFunctionsMap.setValue('rightof', checkRightOf);
        physicFunctionsMap.setValue('beside', checkBeside);
        physicFunctionsMap.setValue('ontop', checkOnTopOf);
        if (cmd.entity.object.form == 'floor') {
            throw ('Cannot move or hold the floor');
        }
        removeObjectsNotInStacks(state);
        var entityObjects = getNodeObjects(cmd.entity, state);
        var interpretation = [];
        if (cmd.location) {
            var locationObjects = getNodeObjects(cmd.location.entity, state);
            for (var i = 0; i < locationObjects.length; i++) {
                for (var j = 0; j < locationObjects[i].length; j++) {
                    for (var k = 0; k < entityObjects.length; k++) {
                        var conjCommands = [];
                        var isPossible = true;
                        for (var l = 0; l < entityObjects[k].length; l++) {
                            if (physicFunctionsMap.getValue(cmd.location.relation)(entityObjects[k][l], locationObjects[i][j], state)) {
                                conjCommands.push({ polarity: true, relation: cmd.location.relation, args: [entityObjects[k][l], locationObjects[i][j]] });
                            }
                            else {
                                isPossible = false;
                            }
                        }
                        if (conjCommands.length != 0 && isPossible) {
                            interpretation.push(conjCommands);
                        }
                    }
                }
            }
        }
        else {
            for (var i = 0; i < entityObjects.length; i++) {
                if (entityObjects[i].length === 1) {
                    for (var j = 0; j < entityObjects[i].length; j++) {
                        interpretation.push([{ polarity: true, relation: "holding", args: [entityObjects[i][j]] }]);
                    }
                }
            }
        }
        if (interpretation.length == 0) {
            throw ('Physically impossible');
        }
        return interpretation;
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
            if (entity.length > 1) {
                var tmpValue = entity[0][0];
                for (var i = 1; i < entity.length; i++) {
                    if (entity[i].length > 1 || entity[i][0] != tmpValue) {
                        throw ('Cannot find a specific object for THE request');
                    }
                    else {
                        entity.splice(i, 1);
                    }
                }
            }
            if (entity.length == 1 && entity[0].length == 1) {
                return entity;
            }
            else {
                throw ('Need to specify the');
            }
        }
        else if (node.quantifier == "any") {
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
            return entity;
        }
        return [];
    }
    function getComplexObject(node, state) {
        var objects = getNodeObjects(node.object, state);
        var concatObjects = Array.prototype.concat.apply([], objects);
        var location = getNodeObjects(node.location, state);
        var intersectionObjects = [];
        for (var i = 0; i < location.length; i++) {
            var innerIntersection = [];
            for (var j = 0; j < location[i].length; j++) {
                if (concatObjects.indexOf(location[i][j]) > -1) {
                    innerIntersection.push(location[i][j]);
                }
            }
            if (innerIntersection.length > 0) {
                intersectionObjects.push(innerIntersection);
            }
        }
        return intersectionObjects;
    }
    function removeObjectsNotInStacks(state) {
        var objectExists = false;
        for (var obj in state.objects) {
            objectExists = false;
            for (var id in state.stacks) {
                if (state.stacks[id].indexOf(obj) > -1 || state.holding == obj) {
                    objectExists = true;
                }
            }
            if (!objectExists) {
                delete state.objects[obj];
            }
        }
    }
})(Interpreter || (Interpreter = {}));
