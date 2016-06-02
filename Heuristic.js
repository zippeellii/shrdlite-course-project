var heuristicFunctions = new collections.Dictionary();
heuristicFunctions.setValue('inside', heuristicOnTopOf);
heuristicFunctions.setValue('above', heuristicAbove);
heuristicFunctions.setValue('under', heuristicUnder);
heuristicFunctions.setValue('leftof', heuristicLeftOf);
heuristicFunctions.setValue('rightof', heuristicRightOf);
heuristicFunctions.setValue('beside', heuristicBeside);
heuristicFunctions.setValue('ontop', heuristicOnTopOf);
function evalHeuristic(interpretation, state) {
    var minLength = Number.MAX_VALUE;
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
        minLength = length < minLength ? length : minLength;
    }
    return minLength;
}
function heuristicOnTopOf(state, literals) {
    if (literals.length == 1) {
        var firstObject = literals[0].args[0];
        var secondObject = literals[0].args[1];
        var totalCost = 0;
        var horizontal = distanceBetweenObjects(state, firstObject, secondObject);
        if (horizontal === 0) {
            return 0;
        }
        totalCost = horizontal + amountOntop(state, secondObject);
        if (state.holding === firstObject) {
            return totalCost + 1;
        }
        totalCost += amountOntop(state, firstObject);
        return totalCost + 2;
    }
    var stacksAlreadyManipulated = [];
    var result = 0;
    for (var i = 0; i < literals.length; i++) {
        var firstObject = literals[i].args[0];
        for (var j = 0; j < state.stacks.length; j++) {
            for (var k = 0; k < state.stacks[j].length; k++) {
                if (state.stacks[j][k] == firstObject) {
                    if (k != 0 && stacksAlreadyManipulated.indexOf(j) < 0) {
                        stacksAlreadyManipulated.push(j);
                        result = result + amountOntop(state, firstObject);
                        result = result + 2;
                    }
                }
            }
        }
    }
    return result;
}
function heuristicAbove(state, literals) {
    var freeCost = 0;
    var shortestDistance = Number.MAX_VALUE;
    var leastMoveCounter = 0;
    for (var k = 0; k < literals.length; k++) {
        for (var i = 0; i < state.stacks.length; i++) {
            if (state.stacks[i].indexOf(literals[k].args[1]) > -1) {
                continue;
            }
            for (var j = state.stacks[i].length - 1; j >= 0; j--) {
                if (state.stacks[i][j] === literals[k].args[0]) {
                    var newDist = distanceBetweenObjects(state, literals[k].args[0], literals[k].args[1]);
                    if (state.holding === literals[k].args[1]) {
                        newDist = distanceFromArm(state, literals[k].args[0]);
                    }
                    shortestDistance = shortestDistance > newDist ? newDist : shortestDistance;
                    freeCost += amountOntop(state, state.stacks[i][j]);
                    leastMoveCounter += 3;
                    break;
                }
            }
        }
    }
    if (shortestDistance === Number.MAX_VALUE) {
        shortestDistance = 1;
    }
    return freeCost + shortestDistance + leastMoveCounter;
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
function heuristicLeftOf(state, literals) {
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
        if (firstIndex < secondIndex) {
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
            result = firstIndex - (secondIndex - 1);
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
            for (var i_3 = 0; i_3 < state.stacks.length; i_3++) {
                if (state.stacks[i_3].indexOf(firstObject) > -1) {
                    firstIndex = i_3;
                    break;
                }
            }
        }
        if (state.holding === secondObject) {
            secondIndex = state.arm;
            holdingSecond = true;
        }
        else {
            for (var i_4 = 0; i_4 < state.stacks.length; i_4++) {
                if (state.stacks[i_4].indexOf(firstObject) > -1) {
                    secondIndex = i_4;
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
