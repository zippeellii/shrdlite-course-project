var heuristicFunctions = new collections.Dictionary();
heuristicFunctions.setValue('inside', heuristicOnTopOf);
heuristicFunctions.setValue('above', heuristicAbove);
heuristicFunctions.setValue('under', heuristicUnder);
heuristicFunctions.setValue('leftof', heuristicLeftOf);
heuristicFunctions.setValue('rightof', heuristicRightOf);
heuristicFunctions.setValue('beside', heuristicBeside);
heuristicFunctions.setValue('ontop', heuristicOnTopOf);
function evalHeuristic(interpretation, state) {
    var totLength = Number.MAX_VALUE;
    for (var i = 0; i < interpretation.length; i++) {
        var length = 0;
        for (var j = 0; j < interpretation[i].length; j++) {
            var object1 = interpretation[i][j].args[0];
            var object2 = interpretation[i][j].args[1];
            var relation = interpretation[i][j].relation;
            length += heuristicFunctions.getValue(relation)(state, object1, object2);
        }
        totLength = length < totLength ? length : totLength;
    }
    return totLength;
}
function heuristicOnTopOf(state, object1, object2) {
}
function heuristicAbove(state, object1, object2) {
}
function heuristicUnder(state, object1, object2) {
}
function heuristicLeftOf(state, object1, object2) {
}
function heuristicRightOf(state, object1, object2) {
}
function heuristicBeside(state, object1, object2) {
}
function heuristicHolding(state, object1) {
    var result = 0;
    if (state.holding === object1) {
        return result;
    }
    if (state.holding != null && state.holding != undefined) {
        result = result + 1;
    }
    var armResult = distanceFromArm(state, object1);
    var ontopResult = amountOntop(state, object1);
    if (armResult > -1 && ontopResult > -1) {
        return result + armResult + ontopResult + 1;
    }
}
function distance(state, object1, object2) {
    var indexFrom = -1;
    var indexTo = -1;
    for (var i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i].indexOf(object1) > -1) {
            indexFrom = i;
        }
        if (state.stacks[i].indexOf(object2) > -1) {
            indexTo = i;
        }
    }
    if (indexFrom > -1 && indexTo > -1) {
        var result = indexTo - indexFrom;
        if (result < 0) {
            return result * -1;
        }
        return result;
    }
    return -1;
}
function distanceFromArm(state, object1) {
    var armIndex = state.arm;
    var objectIndex = -1;
    for (var i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i].indexOf(object1) > -1) {
            var result = armIndex - i;
            if (result < 0) {
                return result * -1;
            }
            return result;
        }
    }
    return -1;
}
function amountOntop(state, object1) {
    var objectsOnTop = 0;
    for (var i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i].indexOf(object1) > -1) {
            var foundObjectInStack = false;
            for (var j = 0; j < state.stacks[i].length; j++) {
                if (foundObjectInStack) {
                    objectsOnTop = objectsOnTop + 1;
                }
                if (state.stacks[i][j] === object1) {
                    foundObjectInStack = true;
                }
            }
            return objectsOnTop * 3;
        }
    }
    return -1;
}
