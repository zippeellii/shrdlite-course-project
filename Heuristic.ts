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
        for (let j = 0; j < interpretation[i].length; j++) {
            let object1 = interpretation[i][j].args[0];
            let object2 = interpretation[i][j].args[1];
            let relation = interpretation[i][j].relation;
            length += heuristicFunctions.getValue(relation)(state, object1, object2);
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
    let horizontal = distanceBetweenObjects(state, object1, object2);
    //Objects are already in same stack or object1 is being held by arm
    if(horizontal === 0){
        return 0;
    }
    //Holding object1
    if(state.holding === object1){
        return distanceFromArm(state, object2);
    }
    //Holding object2
    if(state.holding === object2){
        return distanceFromArm(state, object1);
    }
    //Remove all objects above object1 and move it
    return horizontal + amountOntop(state, object1);
}
//Heuristic if object1 should be under object2
function heuristicUnder(state: WorldState, object1: string, object2: string){
    let horizontal = distanceBetweenObjects(state, object1, object2);
    if(horizontal === 0){
        return 0;
    }
    if(state.holding === object1){
        return distanceFromArm(state, object2);
    }
    if(state.holding === object2){
        return distanceFromArm(state, object1);
    }
    //Remove all objects above object2 and move it
    return horizontal + amountOntop(state, object2);
}
//Heuristic if object1 should be to the left of object2
function heuristicLeftOf(state: WorldState, object1: string, object2: string){
    // distance between leftof and object1
}
//Heuristic if object1 should be to the right of object2
function heuristicRightOf(state: WorldState, object1: string, object2: string){
    // distance between rightof and object1
}

//Heuristic if object1 should be beside object2
function heuristicBeside(state: WorldState, object1: string, object2: string){
    var result = 0;

    if (state.holding === object1) {
        // Smallest distance of directly left of or directly right of
        result = distanceFromArm(state, object2) - 1;

        // Add one for dropping
        return result + 1;
    }

    if (state.holding === object2) {
        // Smallest distance of directly left of or directly right of
        result = distanceFromArm(state, object1) - 1;

        // Add one for dropping
        return result + 1;
    }

    // Smallest distance of directly left of or directly right of
    result = result + distanceBetweenObjects(state, object1, object2) - 1;
    if (result === -1) {
        // In same stack, add two for pickup and drop
        return 2;
    } else if (result === 0) {
        // Directly next to each other
        return result;
    }

    // Add two for picking up and dropping
    return result + 2;
}

//Heuristic if the arm should hold object1
function heuristicHolding(state: WorldState, object1: string){
    var result = 0;
    if (state.holding === object1) {
        return result;
    }
    if (state.holding != null && state.holding != undefined) {
        // If we hold something else, we need to drop it first
        result = result + 1;
    }

    // Move arm into position and remove objects on top
    var armResult = distanceFromArm(state, object1);
    var ontopResult = amountOntop(state, object1);
    if (armResult > -1 && ontopResult > -1) {
        // Add one on the end for picking up
        return result + armResult + ontopResult + 1;
    }
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
    if (indexFrom > -1 && indexTo > -1) {
        var result = indexTo - indexFrom;
         if (result < 0) {
             return result * -1;
         }
         return result;
    }
    return -1;
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
    return -1;
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
    return -1;
}
