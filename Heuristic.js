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
        var relation = interpretation[i][0].relation;
        var literals = interpretation[i];
        if (interpretation[i][0].relation == 'holding') {
            length = heuristicHolding(state, literals);
        }
        else {
            length = heuristicFunctions.getValue(relation)(state, literals);
        }
        totLength = length < totLength ? length : totLength;
    }
    return totLength;
}
function heuristicOnTopOf(state, object1, object2) {
    var totalCost = 0;
    var horizontal = distanceBetweenObjects(state, object1, object2);
    if (horizontal === 0) {
        return 0;
    }
    totalCost = horizontal + amountOntop(state, object2);
    if (state.holding === object1) {
        return totalCost + 1;
    }
    totalCost += amountOntop(state, object1);
    return totalCost + 2;
}
function heuristicAbove(state, object1, object2) {
    var horizontal = distanceBetweenObjects(state, object1, object2);
    if (horizontal === 0) {
        return 0;
    }
    if (state.holding === object1) {
        return distanceFromArm(state, object2) + 1;
    }
    if (state.holding === object2) {
        return distanceFromArm(state, object1) + amountOntop(state, object1) + 3;
    }
    return horizontal + amountOntop(state, object1) + 2;
}
function heuristicUnder(state, object1, object2) {
    var horizontal = distanceBetweenObjects(state, object1, object2);
    if (horizontal === 0) {
        return 0;
    }
    if (state.holding === object1) {
        return distanceFromArm(state, object2) + amountOntop(state, object2) + 3;
    }
    if (state.holding === object2) {
        return distanceFromArm(state, object1) + 1;
    }
    return horizontal + amountOntop(state, object2) + 2;
}
function heuristicLeftOf(state, object1, object2) {
    var result = 0;
    var firstIndex = -1;
    var holdingFirst = false;
    var secondIndex = -1;
    var holdingSecond = false;
    if (state.holding === object1) {
        firstIndex = state.arm;
        holdingFirst = true;
    }
    else {
        for (var i = 0; i < state.stacks.length; i++) {
            if (state.stacks[i].indexOf(object1) > -1) {
                firstIndex = i;
                break;
            }
        }
    }
    if (state.holding === object2) {
        secondIndex = state.arm;
        holdingSecond = true;
    }
    else {
        for (var i = 0; i < state.stacks.length; i++) {
            if (state.stacks[i].indexOf(object1) > -1) {
                secondIndex = i;
                break;
            }
        }
    }
    if (firstIndex < secondIndex) {
        if (holdingFirst || holdingSecond) {
            return 1;
        }
        return 0;
    }
    else {
        result = firstIndex - (secondIndex - 1);
        if (holdingFirst || holdingSecond) {
            return result + 1;
        }
        return result + 2;
    }
}
function heuristicRightOf(state, literals) {
    var shortestOfConjunction = Number.MAX_VALUE;
    for (var i = 0; i < literals.length; i++) {
        var result = 0;
        var firstIndex = -1;
        var holdingFirst = false;
        var secondIndex = -1;
        var holdingSecond = false;
        var firstObject = literals[i].args[0];
        var secondObject = literals[i].args[1];
        if (state.holding === firstObject) {
            firstIndex = state.arm;
            holdingFirst = true;
        }
        else {
            for (var i_1 = 0; i_1 < state.stacks.length; i_1++) {
                if (state.stacks[i_1].indexOf(firstObject) > -1) {
                    firstIndex = i_1;
                    break;
                }
            }
        }
        if (state.holding === secondObject) {
            secondIndex = state.arm;
            holdingSecond = true;
        }
        else {
            for (var i_2 = 0; i_2 < state.stacks.length; i_2++) {
                if (state.stacks[i_2].indexOf(firstObject) > -1) {
                    secondIndex = i_2;
                    break;
                }
            }
        }
        if (firstIndex > secondIndex) {
            if (holdingFirst || holdingSecond) {
                result = 1;
                if (result < shortestOfConjunction) {
                    shortestOfConjunction = result;
                    continue;
                }
            }
            shortestOfConjunction = 0;
            continue;
        }
        else {
            result = (secondIndex + 1) - firstIndex;
            if (holdingFirst || holdingSecond) {
                result = result + 1;
                if (result < shortestOfConjunction) {
                    shortestOfConjunction = result;
                    continue;
                }
            }
            result = result + 2;
            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }
    }
    return shortestOfConjunction;
}
function heuristicBeside(state, literals) {
    var shortestOfConjunction = Number.MAX_VALUE;
    for (var i = 0; i < literals.length; i++) {
        var result = 0;
        var fromObject = literals[i].args[0];
        var toObject = literals[i].args[1];
        if (state.holding === fromObject) {
            result = distanceFromArm(state, toObject) - 1;
            result = result + 1;
            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }
        if (state.holding === toObject) {
            result = distanceFromArm(state, fromObject) - 1;
            result = result + 1;
            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }
        result = distanceBetweenObjects(state, fromObject, toObject) - 1;
        if (result === -1) {
            result = 3;
            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }
        else if (result === 0) {
            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }
        result = result + 2;
        if (result < shortestOfConjunction) {
            shortestOfConjunction = result;
            continue;
        }
    }
    return shortestOfConjunction;
}
function heuristicHolding(state, literals) {
    var result = 0;
    var theObject = literals[0].args[0];
    if (state.holding === theObject) {
        return result;
    }
    if (state.holding != null && state.holding != undefined) {
        result = result + 1;
    }
    var armResult = distanceFromArm(state, theObject);
    var ontopResult = amountOntop(state, theObject);
    return result + armResult + ontopResult + 1;
}
function distanceBetweenObjects(state, object1, object2) {
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
    if (indexFrom === -1) {
        var result = indexTo - state.arm;
        if (result < 0) {
            return result * -1;
        }
        return result;
    }
    else if (indexTo === -1) {
        var result = state.arm - indexFrom;
        if (result < 0) {
            return result * -1;
        }
        return result;
    }
    var result = indexTo - indexFrom;
    if (result < 0) {
        return result * -1;
    }
    return result;
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
    return 0;
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
    return 0;
}
