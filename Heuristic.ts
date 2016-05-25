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
    // distance plus smallest of (remove all above object1) and (remove all above object2)
}
//Heuristic if object1 should be above object2
function heuristicAbove(state: WorldState, object1: string, object2: string){
    // just distance for now
}
//Heuristic if object1 should be under object2
function heuristicUnder(state: WorldState, object1: string, object2: string){
    // just distance for now
}
//Heuristic if object1 should be to the left of object2
function heuristicLeftOf(state: WorldState, object1: string, object2: string){
    // distance between leftof and object1
}
//Heuristic if object1 should be to the right of object2
function heuristicRightOf(state: WorldState, object1: string, object2: string){
    var result = 0;
    var firstIndex = -1;
    var secondIndex = -1;

    // Finds index of object1 regardless of if it is held
    if (state.holding === object1) {
        firstIndex = state.arm;
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
    } else {
        for (let i = 0; i < state.stacks.length; i++) {
            if (state.stacks[i].indexOf(object1) > -1) {
                secondIndex = i;
                break;
            }
        }
    }

    // TODO: Theese two returns could think of whether we hold something or not, and +1 accordingly
    if (firstIndex > secondIndex) {
        return 0;
    } else {
        result = (secondIndex + 1) - firstIndex;
        // Add one for dropping
        return result + 1;
    }
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