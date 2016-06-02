/**
* Contains all the logic for the heuristic used in shrdlite.
* The heuristic differentiates between different relations, and works with conjunctions
*/

var heuristicFunctions = new collections.Dictionary<string, Function>();
heuristicFunctions.setValue('inside', heuristicOnTopOf);
heuristicFunctions.setValue('above', heuristicAbove);
heuristicFunctions.setValue('under', heuristicUnder);
heuristicFunctions.setValue('leftof', heuristicLeftOf);
heuristicFunctions.setValue('rightof', heuristicRightOf);
heuristicFunctions.setValue('beside', heuristicBeside);
heuristicFunctions.setValue('ontop', heuristicOnTopOf);

/*
* Wrapper function for handling heuristic calculation, responsible for
* sending the evaluation to the correct heuristic
*/
function evalHeuristic(interpretation: Interpreter.DNFFormula, state : WorldState) : number {
    var minLength = Number.MAX_VALUE;

    // Takes the smallest of all the heuristics in a conjunction
    for (let i = 0; i < interpretation.length; i++) {
        var length = 0;
        var relation = interpretation[i][0].relation;
        var literals = interpretation[i];
        if (interpretation[i][0].relation == 'holding') {
            length = heuristicHolding(state, literals);
        } else {
            length = heuristicFunctions.getValue(relation)(state, literals);
        }

        //Overwrite if the new length is shorter
        minLength = length < minLength ? length : minLength;
    }
    //Handle the calling here
    return minLength;
}

// Heuristic for the onTopOf (also works for inside) relation
function heuristicOnTopOf(state: WorldState, literals: Interpreter.Literal[]){
    if (literals.length == 1) {
        var firstObject = literals[0].args[0];
        var secondObject = literals[0].args[1];
        let totalCost = 0;
        //Distance between the objects
        let horizontal = distanceBetweenObjects(state, firstObject, secondObject);
        //object1 and object2 is in the same stack
        if(horizontal === 0){
            return 0;
        }
        //Add the distance plus the movement of any possible objects already on top of 2
        totalCost = horizontal + amountOntop(state, secondObject);
        //Arm is already holding object, i.e only need to drop
        if(state.holding === firstObject){
            return totalCost + 1;
        }
        //Add cost to pick up object1
        totalCost += amountOntop(state, firstObject);
        //Add +2 for take and drop
        return totalCost + 2;
    }

    // If we get here we have a conjunction, and a conjunction with
    // onTop will only be physically possible with floor
    var stacksAlreadyManipulated:number[] = [];
    var result = 0;
    for (let i = 0; i < literals.length; i++) {
        var firstObject = literals[i].args[0];
        for (let j = 0; j < state.stacks.length; j++) {
            for (let k = 0; k < state.stacks[j].length; k++) {
                if (state.stacks[j][k] == firstObject) {
                    if (k != 0 && stacksAlreadyManipulated.indexOf(j) < 0) {
                        stacksAlreadyManipulated.push(j);

                        result = result + amountOntop(state, firstObject);

                        // Add two because we need to move and drop it
                        result = result + 2;
                        // ADD THE SHIT
                    }
                }
            }
        }
    }
    return result;
}

// Heuristic for the above relation
function heuristicAbove(state: WorldState, literals: Interpreter.Literal[]){
    var freeCost = 0;
    var shortestDistance = Number.MAX_VALUE;
    var leastMoveCounter = 0;
    for (let k = 0; k < literals.length; k++) {
        for (let i = 0; i < state.stacks.length; i++) {
            if(state.stacks[i].indexOf(literals[k].args[1]) > -1){
                continue;
            }
            for (let j = state.stacks[i].length-1; j >=0; j--) {
                    //Found the object in the stack
                    if(state.stacks[i][j] === literals[k].args[0]){
                        //Is the distance shorter?
                        let newDist = distanceBetweenObjects(state,literals[k].args[0], literals[k].args[1]);
                        if(state.holding === literals[k].args[1]){
                            newDist = distanceFromArm(state, literals[k].args[0]);
                        }
                        shortestDistance = shortestDistance > newDist ? newDist : shortestDistance;
                        freeCost += amountOntop(state, state.stacks[i][j]);
                        //Object that is not already above must be lifted, moved and dropped
                        leastMoveCounter += 3;
                        break;
                    }
            }
        }
    }
    //Found no shortest distance (probably holding object2)
    if(shortestDistance === Number.MAX_VALUE) {
        shortestDistance = 1;
    }
    return freeCost + shortestDistance + leastMoveCounter;
}

//Heuristic for the under relation
function heuristicUnder(state: WorldState, literals: Interpreter.Literal[]){
    var freeCost = 0;
    var shortestDistance = Number.MAX_VALUE;
    var leastMoveCounter = 0;
    for (let k = 0; k < literals.length; k++) {
        for (let i = 0; i < state.stacks.length; i++) {
            if(state.stacks[i].indexOf(literals[k].args[0]) > -1){
                continue;
            }
            for (let j = state.stacks[i].length-1; j >=0; j--) {
                //Found the object in the stack
                if(state.stacks[i][j] === literals[k].args[1]){
                    //Is the distance shorter?
                    let newDist = distanceBetweenObjects(state,literals[k].args[1], literals[k].args[0]);
                    if(state.holding === literals[k].args[0]){
                        newDist = distanceFromArm(state, literals[k].args[1]);
                    }
                    shortestDistance = shortestDistance > newDist ? newDist : shortestDistance;
                    freeCost += amountOntop(state, state.stacks[i][j]);
                    //Object that is not already above must be lifted, moved and dropped
                    leastMoveCounter += 3;
                    break;
                }
            }
        }
    }
    //Found no shortest distance (probably holding object2)
    if(shortestDistance === Number.MAX_VALUE) {
        shortestDistance = 1;
    }
    return freeCost + shortestDistance + leastMoveCounter;
}

//Heuristic for the left of relation
function heuristicLeftOf(state: WorldState, literals: Interpreter.Literal[]){
    var shortestOfConjunction = Number.MAX_VALUE;

    for (let i = 0; i < literals.length; i++) {
        var result = 0;
        var firstIndex = -1;
        var holdingFirst = false;
        var secondIndex = -1;
        var holdingSecond = false;
        var firstObject = literals[i].args[0];
        var secondObject = literals[i].args[1];

        // Finds index of object1 regardless of if it is held
        if (state.holding === firstObject) {
            firstIndex = state.arm;
            holdingFirst = true;
        } else {
            for (let i = 0; i < state.stacks.length; i++) {
                if (state.stacks[i].indexOf(firstObject) > -1) {
                    firstIndex = i;
                    break;
                }
            }
        }

        // Finds index of object2 regardless of if it is held
        if (state.holding === secondObject) {
            secondIndex = state.arm;
            holdingSecond = true;
        } else {
            for (let i = 0; i < state.stacks.length; i++) {
                if (state.stacks[i].indexOf(firstObject) > -1) {
                    secondIndex = i;
                    break;
                }
            }
        }

        if (firstIndex < secondIndex) {
            if (holdingFirst || holdingSecond) {
                // Add one for dropping
                result = 1;
                if (result < shortestOfConjunction) {
                    shortestOfConjunction = result;
                    continue;
                }
            }
            shortestOfConjunction = 0;
            continue;
        } else {
            // Distance from first to exactly one step right of second
            result = firstIndex - (secondIndex - 1);
            if (holdingFirst || holdingSecond) {
                // Add one for dropping
                result = result + 1;
                if (result < shortestOfConjunction) {
                    shortestOfConjunction = result;
                    continue;
                }
            }
            // Add two for pick up and drop
            result = result + 2;
            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }
    }
    return shortestOfConjunction;
}

//Heuristic for the right of relation
function heuristicRightOf(state: WorldState, literals: Interpreter.Literal[]){
    var shortestOfConjunction = Number.MAX_VALUE;

    for (let i = 0; i < literals.length; i++) {
        var result = 0;
        var firstIndex = -1;
        var holdingFirst = false;
        var secondIndex = -1;
        var holdingSecond = false;
        var firstObject = literals[i].args[0];
        var secondObject = literals[i].args[1];

        // Finds index of object1 regardless of if it is held
        if (state.holding === firstObject) {
            firstIndex = state.arm;
            holdingFirst = true;
        } else {
            for (let i = 0; i < state.stacks.length; i++) {
                if (state.stacks[i].indexOf(firstObject) > -1) {
                    firstIndex = i;
                    break;
                }
            }
        }

        // Finds index of object2 regardless of if it is held
        if (state.holding === secondObject) {
            secondIndex = state.arm;
            holdingSecond = true;
        } else {
            for (let i = 0; i < state.stacks.length; i++) {
                if (state.stacks[i].indexOf(firstObject) > -1) {
                    secondIndex = i;
                    break;
                }
            }
        }

        if (firstIndex > secondIndex) {
            if (holdingFirst || holdingSecond) {
                // Add one for dropping
                result = 1;
                if (result < shortestOfConjunction) {
                    shortestOfConjunction = result;
                    continue;
                }
            }
            shortestOfConjunction = 0;
            continue;
        } else {
            // Distance from first to exactly one step right of second
            result = (secondIndex + 1) - firstIndex;
            if (holdingFirst || holdingSecond) {
                // Add one for dropping
                result = result + 1;
                if (result < shortestOfConjunction) {
                    shortestOfConjunction = result;
                    continue;
                }
            }
            // Add two for pick up and drop
            result = result + 2;
            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }
    }
    return shortestOfConjunction;
}

//Heuristic for the beside relation
function heuristicBeside(state: WorldState, literals : Interpreter.Literal[]){
    var shortestOfConjunction = Number.MAX_VALUE;

    for (let i = 0; i < literals.length; i++) {
        var result = 0;
        var fromObject = literals[i].args[0];
        var toObject = literals[i].args[1];


        if (state.holding === fromObject) {
            // Smallest distance of directly left of or directly right of
            result = distanceFromArm(state, toObject) - 1;

            // Add one for dropping
            result = result + 1;

            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }

        if (state.holding === toObject) {
            // Smallest distance of directly left of or directly right of
            result = distanceFromArm(state, fromObject) - 1;

            // Add one for dropping
            result = result + 1;

            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }

        // Smallest distance of directly left of or directly right of
        result = distanceBetweenObjects(state, fromObject, toObject) - 1;
        if (result === -1) {
            // In same stack, add three for pickup, move and drop
            result = 3;
            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        } else if (result === 0) {
            // Directly next to each other
            if (result < shortestOfConjunction) {
                shortestOfConjunction = result;
                continue;
            }
        }

        // Add two for picking up and dropping
        result = result + 2;
        if (result < shortestOfConjunction) {
            shortestOfConjunction = result;
            continue;
        }
    }
    return shortestOfConjunction;
}

// Heuristic for the holding relation, does not work with conjunections because
// it is impossible to hold several things in shrdlite
function heuristicHolding(state: WorldState, literals : Interpreter.Literal[]) {
    var result = 0;
    var theObject = literals[0].args[0];
    if (state.holding === theObject) {
        return result;
    }
    if (state.holding != null && state.holding != undefined) {
        // If we hold something else, we need to drop it first
        result = result + 1;
    }

    // Move arm into position and remove objects on top
    var armResult = distanceFromArm(state, theObject);
    var ontopResult = amountOntop(state, theObject);
    return result + armResult + ontopResult + 1;
}

// Helper function for heuristic functions
// Horizontal distance from object1 to object2
function distanceBetweenObjects(state: WorldState, object1: string, object2: string) : number {
    var indexFrom = -1;
    var indexTo = -1;
    for (let i = 0; i < state.stacks.length; i++) {
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
    } else if (indexTo === -1) {
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

// Helper function for heuristic functions
// Horizontal distance from the arm to object1
function distanceFromArm(state: WorldState, object1: string) : number {
    var armIndex = state.arm;
    var objectIndex = -1;
    for (let i = 0; i < state.stacks.length; i++) {
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

// Helper function for heuristic functions
// Moves needed to remove everything ontop of an object and return to original state
function amountOntop(state: WorldState, object1: string) : number {
    var objectsOnTop = 0;
    for (let i = 0; i < state.stacks.length; i++) {
        if (state.stacks[i].indexOf(object1) > -1) {
            var foundObjectInStack = false;
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (foundObjectInStack) {
                    objectsOnTop = objectsOnTop + 1;
                }
                if (state.stacks[i][j] === object1) {
                    foundObjectInStack = true;
                }
            }
            // Multiply by 4 because it is the lowest amount of moves ever
            // possible for moving something from a stack and dropping it somewhere else
            return objectsOnTop * 3;
        }
    }
    return 0;
}
