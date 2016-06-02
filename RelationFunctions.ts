/**
* Shared functions for relation logic.
* Both Planner.ts and and Interpreter.ts utilizes these functions.
* All the functions except the checking functions take disjunctions of
* conjunctions also returns disjunctions of conjunctions.
*/

// Return all objects left of the entites
function getObjectsLeftOf(entity : string[][], state : WorldState) : string[][] {
    var tmp : string[][] = [];
    // For each disjunction
    for (let k = 0; k < entity.length; k++) {
        var innerTmp : string[] = [];
        var distanceFromLeftAllowed = state.stacks.length-1;
        // Finds the leftmost object so that we know which index we need to be left of
        for (let i = distanceFromLeftAllowed; i >= 0; i--) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    distanceFromLeftAllowed = i;
                }
            }
        }
        // Adds everything in stacks to the left of distanceFromLeftAllowed
        for (let i = 0; i < distanceFromLeftAllowed; i++) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                innerTmp.push(state.stacks[i][j]);
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}

// Return all objects right of the entites
function getObjectsRightOf(entity : string[][], state : WorldState) : string[][] {
    // Return all objects right of the entites
    var tmp : string[][] = [];
    // For each disjunction
    for (let k = 0; k < entity.length; k++) {
        var innerTmp : string[] = [];
        var distanceFromRightAllowed = 0;
        // Finds the rightmost object so that we know which index we need to be right of
        for (let i = 0; i < state.stacks.length; i++) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    distanceFromRightAllowed = i;
                }
            }
        }
        // Adds everything in stacks to the right of distanceFromRightAllowed
        for (let i = distanceFromRightAllowed+1; i < state.stacks.length; i++) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                innerTmp.push(state.stacks[i][j]);
            }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp);
        }
    }
    return tmp;
}

// Returns the objects that are inside all the entities
function getObjectsInside(entity : string[][], state : WorldState) : string[][] {
    var tmp : string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp : string[] = [];

        // Check so that all entities are boxes
        for (let i = 0; i < entity[k].length; i++) {
            for (var key in state.objects) {
                if (key == entity[k][i]) {
                    if (state.objects[key].form != "box") {
                        return tmp;
                    }
                }
            }
        }

        // Goes through all stacks and looks for the boxes, if there is
        // something ontop of the box and it fits in the box then we add it
        for (let i = 0; i < state.stacks.length; i++) {
            var boxFound = "";
            for (let j = 0; j < state.stacks[i].length; j++) {
                var object = state.stacks[i][j];
                if (boxFound != "") {
                    // Check if item is eligble to fit in the box
                    if (checkOnTopOf(state.stacks[i][j], boxFound, state)) {
                        innerTmp.push(state.stacks[i][j]);
                    }
                    boxFound = "";
                } else {
                    // Check if current object is in our entity, save it if it is
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

    // Returns objects directly on top of entity (will not work for more than one entity)
function getObjectsOntop(entity : string[][], state : WorldState) : string[][] {

    var tmp : string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp : string[] = [];
        if(entity[k].length != 1) {
            continue;
        }
        for (let i = 0; i < state.stacks.length; i++) {
          if (entity[0][0] == 'floor') {
              if(state.stacks[i][0]) {
                innerTmp.push(state.stacks[i][0]);
              }
          } else {
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    if (state.stacks[i][j+1]) {
                        innerTmp.push(state.stacks[i][j+1]);
                    }
                }
            }
          }
        }
        if (innerTmp.length > 0) {
            tmp.push(innerTmp.slice());
        }
    }
    return tmp;
}

// Returns objects under (not just directly under) the entites
function getObjectsUnder(entity : string[][], state : WorldState) : string[][] {
    var tmp : string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp : string[] = [];

        // Checks so that all are in same stack and returns what is under
        for (let i = 0; i < state.stacks.length; i++) {
            var count = 0;
            var nbrOfEntities = entity[k].length;
            for (let j = state.stacks[i].length-1; j >= 0; j--) {
                if (nbrOfEntities == count) {
                    // All entities was in this stack, start pushing what objects remain above
                    innerTmp.push(state.stacks[i][j]);
                } else {
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

// Return all objects beside the entity
function getObjectsBeside(entity : string[][], state : WorldState) : string[][] {
    var tmp : string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp : string[] = [];

        var columnsWithEntities : number[] = [];

        // Finds columns which has entities inside them and
        // fills columnsWithEntities accordingly
        for (let i = 0; i < state.stacks.length; i++) {
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (entity[k].indexOf(state.stacks[i][j]) > -1) {
                    columnsWithEntities.push(i);
                    break;
                }
            }
        }

        // Adds the entities in the "allowed" rows
        for (let i = 0; i < state.stacks.length; i++) {
          if (columnsWithEntities.indexOf(i) >= 0) {
            if (i > 0) {
              for (let j = 0; j < state.stacks[i-1].length; j++) {
                  innerTmp.push(state.stacks[i-1][j]);
              }
            }
            if (i < state.stacks.length-2) {
              for (let j = 0; j < state.stacks[i+1].length; j++) {
                  innerTmp.push(state.stacks[i+1][j]);
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

// Returns objects above (not just directly above) the entites
function getObjectsAbove(entity : string[][], state : WorldState) : string[][] {
    var tmp : string[][] = [];

    for (let k = 0; k < entity.length; k++) {
        var innerTmp : string[] = [];

        // Checks so that all are in same stack and returns what is above
        for (let i = 0; i < state.stacks.length; i++) {
            var count = 0;
            var nbrOfEntities = entity[k].length;
            for (let j = 0; j < state.stacks[i].length; j++) {
                if (nbrOfEntities == count) {
                    // All entities was in this stack, start pushing what objects remain above
                    innerTmp.push(state.stacks[i][j]);
                } else {
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

//****Functions for checking physical laws****
//Check that object1 can be on top of object 2
var checkOnTopOf = function (object1 : string, object2 : string, state : WorldState) : boolean {
  if (object2 === undefined || object1 === undefined || object1 === 'floor') {
      return false;
  }
  var objects = state.objects;
  if(object2 == 'floor'){
    return true;
  }
  //A ball cannot be on top of anything other than a box (inside) or the floor
  if(objects[object1].form == 'ball' && objects[object2].form != 'box'){
    return false;
  }
  //A ball cannot have anything ontop of itself
  if(objects[object2].form == 'ball'){
    return false;
  }
  //A small object cannot support a large object
  if(objects[object1].size == 'large' && objects[object2].size == 'small'){
    return false;
  }


  // A box cannot contain pyrmamids, planks or boxes of the same size
  if(objects[object2].form == 'box'){
    if(objects[object1].form == 'pyramid' || objects[object1].form == 'plank' || objects[object1].form == 'box'){
      if((objects[object1].size == 'large' && objects[object2].size == 'large') || objects[object2].size == 'small'){
        return false;
      }
    }
  }
  if(objects[object1].form == 'box'){
    if(objects[object1].size == 'small'){
      //Small boxes cannot be supported by small bricks or pyramids
      if((objects[object2].form == 'pyramid' || objects[object2].form == 'brick') && objects[object2].size == 'small'){
        return false;
      }
    }
    else if(objects[object1].size == 'large'){
      //Large boxes cannot be supported by large pyramids
      if(objects[object2].form == 'pyramid' && objects[object2].size == 'large'){
        return false;
      }
    }
  }
  return true;
}
//Check that object1 can be above object2
var checkAbove = function(object1 : string, object2 : string, state : WorldState) : boolean{
  if(object1 === 'floor'){
    return false;
  }
  if (object2 === 'floor') {
    return true;
  }
  if (state.objects[object1].size === 'large' && state.objects[object1].size === 'small') {
    return false;
  }
  //Nothing can be above a ball
  if(state.objects[object2].form == 'ball'){
    return false;
  }
  return true;
}
//Check that object1 can be under object2
var checkUnder = function(object1 : string, object2 : string, state : WorldState) : boolean{
  //If one can exist under the other is above
  return checkAbove(object2, object1, state);
}
//Check that object1 can be beside object2
var checkBeside = function(object1 : string, object2 : string, state : WorldState) : boolean{
  if(object2 === 'floor' || object1 == 'floor') {
    return false;
  }
  return object1 != object2;
}
//Check that object1 can be left of object2
var checkLeftOf = function(object1 : string, object2 : string, state : WorldState) : boolean{
  if(object2 === 'floor' || object1 == 'floor') {
    return false;
  }
  return object1 != object2;

}
//Check that object1 can be right of object2
var checkRightOf = function(object1 : string, object2 : string, state : WorldState) : boolean{
  if(object2 === 'floor' || object1 == 'floor') {
    return false;
  }
  return object1 != object2;
}
