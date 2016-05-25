// If onTop, object2 can only be FLOOR (ingen inside funkar)
    // Ta bort allt som är OVANFÖR de som ska flyttas, +2 för varje grej
        // Spara undan för varje stack hur mycket vi "tagit bort"

// If above, det som behövs för att ta bort allt som ligger på de som ska flyttas upp (och inte ligger ovanpå)
    // Plussa på minsta distansen som inte är noll
        // Plussa på 3 för varje som inte ligger där de ska

// If beside, ta minsta distansen som inte är noll

// If left-/right-of,

// If under,

var heuristicFunctions = new collections.Dictionary<string, Function>();
heuristicFunctions.setValue('inside', heuristicOnTopOf);
heuristicFunctions.setValue('above', heuristicAbove);
heuristicFunctions.setValue('under', heuristicUnder);
heuristicFunctions.setValue('leftof', heuristicLeftOf);
heuristicFunctions.setValue('rightof', heuristicRightOf);
heuristicFunctions.setValue('beside', heuristicBeside);
heuristicFunctions.setValue('ontop', heuristicOnTopOf);

/*Wrapper function for handling heuristic calculation, responsible for
sending the evaluation to the correct heuristic*/
function evalHeuristic(interpretation: Interpreter.DNFFormula, state : WorldState) : number {
    var totLength = Number.MAX_VALUE;
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
        totLength = length < totLength ? length : totLength;
    }
    //Handle the calling here
    return totLength;
}

//Heuristic if object1 should be onTopOf(inside) object2
function heuristicOnTopOf(state: WorldState, object1: string, object2: string){
    //TODO: Check if in the same stack, should calculate something
    let totalCost = 0;
    //Distance between the objects
    let horizontal = distanceBetweenObjects(state, object1, object2);
    //object1 and object2 is in the same stack
    if(horizontal === 0){
        return 0;
    }
    //Add the distance plus the movement of any possible objects already on top of 2
    totalCost = horizontal + amountOntop(state, object2);
    //Arm is already holding object, i.e only need to drop
    if(state.holding === object1){
        return totalCost + 1;
    }
    //Add cost to pick up object1
    totalCost += amountOntop(state, object1);
    //Add +2 for take and drop
    return totalCost + 2;
}
//Heuristic if object1 should be above object2
function heuristicAbove(state: WorldState, object1: string, object2: string){
    //TODO: Can be optimized, u know
    let horizontal = distanceBetweenObjects(state, object1, object2);
    //Objects are already in same stack or object1 is being held by arm
    if(horizontal === 0){
        return 0;
    }
    //Holding object1
    if(state.holding === object1){
        //Add one for dropping
        return distanceFromArm(state, object2) + 1;
    }
    //Holding object2
    if(state.holding === object2){
        //Add three for dropping object2 and picking up and drop object1
        return distanceFromArm(state, object1)+ amountOntop(state, object1) + 3;
    }
    //Remove all objects above object1 and move it
    return horizontal + amountOntop(state, object1)+2;
}
//Heuristic if object1 should be under object2
function heuristicUnder(state: WorldState, object1: string, object2: string){
    let horizontal = distanceBetweenObjects(state, object1, object2);
    if(horizontal === 0){
        return 0;
    }
    if(state.holding === object1){
        //Add three for dropping object1 and picking up object2 and drop object 2
        return distanceFromArm(state, object2) + amountOntop(state, object2) + 3;
    }
    if(state.holding === object2){
        //Add one for dropping object2
        return distanceFromArm(state, object1) + 1;
    }
    //Add two for picking up and dropping object2
    return horizontal + amountOntop(state, object2) + 2;
}
//Heuristic if object1 should be to the left of object2
function heuristicLeftOf(state: WorldState, object1: string, object2: string){
    var result = 0;
    var firstIndex = -1;
    var holdingFirst = false;
    var secondIndex = -1;
    var holdingSecond = false;

    // Finds index of object1 regardless of if it is held
    if (state.holding === object1) {
        firstIndex = state.arm;
        holdingFirst = true;
    } else {
        for (let i = 0; i < state.stacks.length; i++) {
            if (state.stacks[i].indexOf(object1) > -1) {
                firstIndex = i;
                break;
            }
        }
    }

    // Finds index of object2 regardless of if it is held
    if (state.holding === object2) {
        secondIndex = state.arm;
        holdingSecond = true;
    } else {
        for (let i = 0; i < state.stacks.length; i++) {
            if (state.stacks[i].indexOf(object1) > -1) {
                secondIndex = i;
                break;
            }
        }
    }

    if (firstIndex < secondIndex) {
        if (holdingFirst || holdingSecond) {
            // Add one for dropping
            return 1;
        }
        return 0;
    } else {
        // Distance from first to exactly one step right of second
        result = firstIndex - (secondIndex - 1);
        if (holdingFirst || holdingSecond) {
            // Add one for dropping
            return result + 1;
        }
        // Add two for pick up and drop
        return result + 2;
    }
}

//Heuristic if object1 should be to the right of object2
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

//Heuristic if object1 should be beside object2
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

//Heuristic if the arm should hold object1
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

//Horizontal distance from object1 to object2
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

//Horizontal distance from the arm to object1
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
