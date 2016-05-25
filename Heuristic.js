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
            return objectsOnTop * 4;
        }
    }
}
